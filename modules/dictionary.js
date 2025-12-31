const fs = require('fs'),
	_ = require('lodash'),
	https = require('https'),
	fetch = require('node-fetch'),

	utils = require('./utils.js'),
	errors = require('./errors.js'),

	httpsAgent = new https.Agent({ keepAlive: true });

// Cache for Datamuse results to avoid repeated API calls
const datamuseCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function transformV2toV1(data) {
	return data.map((entry) => {
		let {
			meanings,
			...otherProps
		} = entry;

		meanings = meanings.reduce((meanings, meaning) => {
			let partOfSpeech, definitions;

			({
				partOfSpeech,
				definitions
			} = meaning);
			meanings[partOfSpeech] = definitions;

			return meanings;
		}, {});

		return {
			...otherProps,
			meaning: meanings
		};
	});
}

// Original Google transform function
function transformGoogle(word, language, data, { include }) {
	return data
		.map(e => e.entry)
		.filter(e => e)
		.reduce((accumulator, entry) => {
			if (!entry.subentries) { return accumulator.push(entry) && accumulator; }

			let { subentries } = entry,
				mappedSubentries;

			if (subentries.length > 1) {
				utils.logEvent(word, language, 'subentries length is greater than 1', { data });
			}

			if (entry.sense_families) {
				utils.logEvent(word, language, 'entry has subentries and sense families', { data });
			}

			if (entry.etymology) {
				utils.logEvent(word, language, 'entry has subentries and etymology', { data });
			}

			mappedSubentries = subentries
				.map((subentry) => {
					if (subentry.sense_families) {
						utils.logEvent(word, language, 'subentry has sense families', { data });
					}

					if (subentry.sense_family) {
						subentry.sense_families = [];
						subentry.sense_families.push(subentry.sense_family);
					}

					return _.defaults(subentry, _.pick(entry, ['phonetics', 'etymology']))
				})

			return accumulator.concat(mappedSubentries);
		}, [])
		.map((entry) => {
			let { headword, lemma, phonetics = [], etymology = {}, sense_families = [] } = entry;

			return {
				word: lemma || headword,
				phonetic: _.get(phonetics, '0.text'),
				phonetics: phonetics.map((e) => {
					return {
						text: e.text,
						audio: e.oxford_audio
					};
				}),
				origin: _.get(etymology, 'etymology.text'),
				meanings: sense_families.map((sense_family) => {
					let { parts_of_speech, senses = [] } = sense_family;

					if (!parts_of_speech) {
						parts_of_speech = _.get(senses[0], 'parts_of_speech', []);

						if (senses.length > 1) {
							utils.logEvent(word, language, 'part of speech missing but more than one sense present', { data });
						}
					}

					if (parts_of_speech.length > 1) {
						utils.logEvent(word, language, 'more than one part of speech present', { data });
					}

					return {
						partOfSpeech: _.get(parts_of_speech[0], 'value'),
						definitions: senses.map((sense) => {
							let { definition = {}, example_groups = [], thesaurus_entries = [] } = sense,
								result = {
									definition: definition.text,
									example: _.get(example_groups[0], 'examples.0'),
									synonyms: _.get(thesaurus_entries[0], 'synonyms.0.nyms', [])
										.map(e => e.nym),
									antonyms: _.get(thesaurus_entries[0], 'antonyms.0.nyms', [])
										.map(e => e.nym)
								};

							if (include.example) {
								result.examples = _.reduce(example_groups, (accumulator, example_group) => {
									let example = _.get(example_group, 'examples', []);

									accumulator = accumulator.concat(example);

									return accumulator;
								}, []);
							}

							return result;
						})
					};
				})
			};
		});
}

// Original Google API query
async function queryGoogle(word, language) {
	let url = new URL('https://www.google.com/async/callback:5493');

	url.searchParams.set('fc', 'ErUBCndBTlVfTnFUN29LdXdNSlQ2VlZoWUIwWE1HaElOclFNU29TOFF4ZGxGbV9zbzA3YmQ2NnJyQXlHNVlrb3l3OXgtREpRbXpNZ0M1NWZPeFo4NjQyVlA3S2ZQOHpYa292MFBMaDQweGRNQjR4eTlld1E4bDlCbXFJMBIWU2JzSllkLVpHc3J5OVFPb3Q2aVlDZxoiQU9NWVJ3QmU2cHRlbjZEZmw5U0lXT1lOR3hsM2xBWGFldw');
	url.searchParams.set('fcv', '3');
	url.searchParams.set('async', `term:${encodeURIComponent(word)},corpus:${language},hhdr:true,hwdgt:true,wfp:true,ttl:,tsl:,ptl:`);

	url = url.toString();

	let response = await fetch(url, {
		agent: httpsAgent,
		headers: new fetch.Headers({
			"accept": "*/*",
			"accept-encoding": "gzip, deflate, br",
			"accept-language": "en-US,en;q=0.9",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
		})
	});

	if (response.status === 404) { throw new errors.NoDefinitionsFound({ reason: 'Website returned 404.' }); }

	if (response.status === 429) { throw new errors.RateLimitError(); }

	if (response.status !== 200) { throw new Error(`Google returned status ${response.status}`); }

	let body = await response.text(),
		data = JSON.parse(body.substring(4)),
		single_results = _.get(data, 'feature-callback.payload.single_results', []),
		error = _.chain(single_results)
			.find('widget')
			.get('widget.error')
			.value()

	if (single_results.length === 0) { throw new errors.NoDefinitionsFound({ word, language }); }

	if (error === 'TERM_NOT_FOUND_ERROR') { throw new errors.NoDefinitionsFound({ word, language }); }

	if (error) { throw new Error(`Google returned error: ${error}`); }

	return single_results;
}

// Datamuse API for synonyms and antonyms
async function fetchDatamuse(word, type) {
	const cacheKey = `${type}:${word.toLowerCase()}`;
	const cached = datamuseCache.get(cacheKey);

	if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
		return cached.data;
	}

	try {
		const url = `https://api.datamuse.com/words?rel_${type}=${encodeURIComponent(word)}`;
		const response = await fetch(url);

		if (response.status === 200) {
			const data = await response.json();
			// Extract just the words, limit to top 5 by score
			const words = data
				.slice(0, 5)
				.map(item => item.word);

			datamuseCache.set(cacheKey, { data: words, timestamp: Date.now() });
			return words;
		}
	} catch (err) {
		console.error(`Datamuse API error for ${type} of "${word}":`, err.message);
	}

	return [];
}

async function getSynonyms(word) {
	return fetchDatamuse(word, 'syn');
}

async function getAntonyms(word) {
	return fetchDatamuse(word, 'ant');
}

// Wiktionary transform function - now async to fetch synonyms/antonyms
async function transformWiktionary(word, data) {
	// Fetch synonyms and antonyms from Datamuse
	const [synonyms, antonyms] = await Promise.all([
		getSynonyms(word),
		getAntonyms(word)
	]);

	return [{
		word: word,
		phonetic: '',
		phonetics: [],
		origin: '',
		meanings: data.map(entry => ({
			partOfSpeech: entry.partOfSpeech.toLowerCase(),
			definitions: entry.definitions.map((def, index) => ({
				definition: def.definition,
				example: def.examples && def.examples.length > 0 ? def.examples[0] : '',
				// Only add synonyms/antonyms to first definition to avoid repetition
				synonyms: index === 0 ? synonyms : [],
				antonyms: index === 0 ? antonyms : []
			}))
		}))
	}];
}

// Wiktionary API query
async function queryWiktionary(word, language) {
	const candidates = _.uniq([
		word,
		word.toLowerCase(),
		word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		word.toUpperCase()
	]);

	for (const candidate of candidates) {
		const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(candidate)}`;

		try {
			const response = await fetch(url);

			if (response.status === 200) {
				const json = await response.json();
				if (json[language]) {
					return { data: json[language], word: candidate };
				}
			}
		} catch (err) {
			console.error(`Wiktionary: Failed to fetch for candidate: ${candidate}`, err.message);
		}
	}

	return null;
}

async function findDefinitions(word, language, { include }) {
	// Strategy: Try Google first (has richer data), fallback to Wiktionary + Datamuse if Google fails

	// Try Google first
	try {
		const googleData = await queryGoogle(word, language);
		if (!_.isEmpty(googleData)) {
			console.log(`Using Google data for: ${word}`);
			return transformGoogle(word, language, googleData, { include });
		}
	} catch (googleError) {
		console.log(`Google failed for "${word}": ${googleError.message}, trying Wiktionary + Datamuse...`);
	}

	// Fallback to Wiktionary + Datamuse for synonyms/antonyms
	const wiktionaryResult = await queryWiktionary(word, language);

	if (wiktionaryResult) {
		console.log(`Using Wiktionary + Datamuse data for: ${word}`);
		return await transformWiktionary(wiktionaryResult.word, wiktionaryResult.data);
	}

	// Both sources failed
	throw new errors.NoDefinitionsFound({ word, language });
}

module.exports = {
	findDefinitions,
	transformV2toV1
};

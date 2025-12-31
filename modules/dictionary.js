const fetch = require('node-fetch'),
	errors = require('./errors.js');

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

function transformWiktionary(word, data) {
	return [{
		word: word,
		phonetics: [],
		meanings: data.map(entry => ({
			partOfSpeech: entry.partOfSpeech.toLowerCase(),
			definitions: entry.definitions.map(def => ({
				definition: def.definition,
				example: def.examples && def.examples.length > 0 ? def.examples[0] : undefined
			}))
		}))
	}];
}

async function findDefinitions(word, language, { include }) {
	// We strictly use en.wiktionary.org for now as it has the reliable REST API.
	const candidates = _.uniq([
		word,
		word.toLowerCase(),
		word.charAt(0).toUpperCase() + word.slice(1),
		word.toUpperCase()
	]);

	for (const candidate of candidates) {
		const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(candidate)}`;

		try {
			const response = await fetch(url);

			if (response.status === 200) {
				const json = await response.json();
				if (json[language]) {
					return transformWiktionary(candidate, json[language]);
				}
			}
		} catch (err) {
			// Ignore errors and try next candidate
			console.error(`Failed to fetch for candidate: ${candidate}`, err);
		}
	}

	// If we reach here, no candidates worked
	throw new errors.NoDefinitionsFound({ word, language });
}

module.exports = {
	findDefinitions,
	transformV2toV1
};

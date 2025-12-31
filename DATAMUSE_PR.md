# Add Datamuse API for Synonyms/Antonyms

## Summary

This PR enhances the Wiktionary fallback by integrating the **Datamuse API** to provide synonyms and antonyms. When the Google API fails and we fall back to Wiktionary, we now fetch synonyms/antonyms from Datamuse to maintain feature parity.

## Changes

### New Features
- **Datamuse API Integration**: Fetches synonyms (`rel_syn`) and antonyms (`rel_ant`) from Datamuse
- **Caching**: 1-hour TTL cache for Datamuse results to reduce API calls
- **Top 5 Results**: Returns the top 5 synonyms/antonyms sorted by relevance score

### Files Modified
- `modules/dictionary.js`: Added Datamuse fetching functions and integrated with Wiktionary transform
- `README.md`: Updated data source documentation to include Datamuse attribution

## API Response Example

```json
{
  "word": "happy",
  "phonetic": "",
  "phonetics": [],
  "origin": "",
  "meanings": [
    {
      "partOfSpeech": "adjective",
      "definitions": [
        {
          "definition": "Having a feeling arising from a consciousness of well-being...",
          "example": "Music makes me happy.",
          "synonyms": ["halcyon", "content", "bright", "felicitous", "riant"],
          "antonyms": ["sad", "distressed", "unhappy", "dysphoric"]
        }
      ]
    }
  ]
}
```

## Testing Results

| Word | Synonyms | Antonyms |
|------|----------|----------|
| `happy` | halcyon, content, bright, felicitous, riant | sad, distressed, unhappy, dysphoric |
| `hello` | hullo, how-do-you-do, hi, howdy | (none) |
| `fast` | quick, rapid, speedy, swift, fleet | slow |
| `big` | large, great, huge, vast, immense | small, little |

## Data Flow

```
Request for word
       ↓
  Try Google API
       ↓
   Success? ─── Yes ──→ Return Google data (includes synonyms/antonyms)
       │
      No
       ↓
  Try Wiktionary
       ↓
   Success? ─── No ──→ Return 404
       │
      Yes
       ↓
  Fetch from Datamuse (parallel):
    - GET /words?rel_syn={word}
    - GET /words?rel_ant={word}
       ↓
  Merge Wiktionary definitions + Datamuse synonyms/antonyms
       ↓
  Return combined response
```

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| Definitions | ✅ Wiktionary | ✅ Wiktionary |
| Synonyms | ❌ Empty | ✅ Datamuse (top 5) |
| Antonyms | ❌ Empty | ✅ Datamuse (top 5) |
| Phonetics | ❌ Empty | ❌ Empty (future enhancement) |
| Origin | ❌ Empty | ❌ Empty (future enhancement) |

## Datamuse API Info

- **Free**: No API key required
- **Rate Limit**: 100,000 requests/day (very generous)
- **Reliability**: Well-maintained, production-ready
- **Documentation**: https://www.datamuse.com/api/

## Caching Strategy

To minimize external API calls:
- Results are cached in-memory with 1-hour TTL
- Cache key format: `{type}:{word}` (e.g., `syn:happy`)
- Cache is per-process (resets on server restart)

## Future Enhancements

- [ ] Add Redis/external cache for distributed deployments
- [ ] Parse Wiktionary HTML for IPA pronunciation
- [ ] Add etymology extraction from Wiktionary
- [ ] Consider adding pronunciation audio from other free sources

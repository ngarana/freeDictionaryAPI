# Free Dictionary API

There was no free Dictionary API on the web when I wanted one for my friend, so I created one.

## Data Source & License

This API uses multiple data sources:

- **[Wiktionary](https://en.wiktionary.org/)** — Dictionary definitions via the Wiktionary REST API
- **[Datamuse](https://www.datamuse.com/api/)** — Synonyms and antonyms (free API, no key required)

### Attribution

Dictionary definitions provided by this API are sourced from [Wiktionary](https://en.wiktionary.org/), a project of the [Wikimedia Foundation](https://wikimediafoundation.org/).

The content from Wiktionary is available under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC-BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).

Synonyms and antonyms are provided by the [Datamuse API](https://www.datamuse.com/api/), which is free to use.

**If you use this API, you must:**
- Provide attribution to Wiktionary as the source of the definitions
- Include a link to the CC-BY-SA 4.0 license
- If you modify the content, you must distribute your contributions under the same license

For individual word entries, the original contributors can be found in the page history at `https://en.wiktionary.org/wiki/<word>`.

## Important Note
The API usage has been ramping up rapidly, making it difficult for me to keep the server running due to increased AWS costs.

Your support directly helps the development of Dictionary API and keeps the server running.

<a href="https://www.buymeacoffee.com/meetdeveloper"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&amp;emoji=&amp;slug=meetdeveloper&amp;button_colour=5F7FFF&amp;font_colour=ffffff&amp;font_family=Poppins&amp;outline_colour=000000&amp;coffee_colour=FFDD00"></a>

## Getting Started

### Usage 

The basic syntax of a URL request to the API is shown below:

`https://api.dictionaryapi.dev/api/<--version-->/entries/en/<--word-->`

As an example, to get definition of English word **hello** using _v2_, you can send request to

`https://api.dictionaryapi.dev/api/v2/entries/en/hello` and the result returned will be:

```json
[
  {
    "word": "hello",
    "phonetics": [],
    "meanings": [
      {
        "partOfSpeech": "interjection",
        "definitions": [
          {
            "definition": "A greeting (salutation) said when meeting someone or acknowledging someone's arrival or presence.",
            "example": "Hello, everyone."
          },
          {
            "definition": "A greeting used when answering the telephone.",
            "example": "Hello? How may I help you?"
          }
        ]
      },
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "\"Hello!\" or an equivalent greeting.",
            "example": "They gave each other a quick hello when they met, and went back on their merry ways."
          }
        ]
      },
      {
        "partOfSpeech": "verb",
        "definitions": [
          {
            "definition": "To greet with \"hello\"."
          }
        ]
      }
    ]
  }
]
```

> **Note:** The API now uses Wiktionary as its data source. Response format remains compatible but some fields like `phonetic`, `origin`, `synonyms`, and `antonyms` may not always be present.

### Regarding V1 Version
The API earlier used to send response as shown below, but this structure of response was found out to be difficult to work with (you can take a look at these tickets [#32](https://github.com/meetDeveloper/freeDictionaryAPI/issues/32) and [#4](https://github.com/meetDeveloper/freeDictionaryAPI/issues/4)), based on feedback in these tickets I have updated the API to _v2_ version. But _v1_ version will always be supported for backward compatibility.

```json
[
  {
    "word": "hello",
    "phonetics": [],
    "meaning": {
      "interjection": [
        {
          "definition": "A greeting (salutation) said when meeting someone.",
          "example": "Hello, everyone."
        }
      ],
      "noun": [
        {
          "definition": "\"Hello!\" or an equivalent greeting.",
          "example": "They gave each other a quick hello."
        }
      ],
      "verb": [
        {
          "definition": "To greet with \"hello\"."
        }
      ]
    }
  }
]
```

### Paths

| Location | Endpoint |
| :-- | :-- |
| Root path | `https://api.dictionaryapi.dev/api/<--version-->`|

### HTTP request and query methods

| Method | Endpoint | Description | Examples |
| :-- | :-- | :-- | :-- |
| `GET` | `/entries/en/<YOUR_WORD>`| Retrieves the definition of the given word. | [`/api/v2/entries/en/bliss`](https://api.dictionaryapi.dev/api/v2/entries/en/bliss) |

## Future plans  

You can see existing and add new feature proposals on the projects GitHub page.
Pull requests are welcome!

If you need any assistance or find any bugs, feel free to contact me directly via [email](mailto:help@dictionaryapi.dev) or [create a new issue](https://github.com/meetDeveloper/freeDictionaryAPI/issues) on the GitHub page.

## Support Me
This Dictionary API was initially created as an API that could be used by my friend for his project. I did not in my wildest dream thought that this API will become so popular, in few months this API took off and many people started to use it, initially I was able to manage the server costs but as number of requests started increasing, so did the server costs. Currently API has more than 10 million requests per month and to keep it running I need support of the community. I have planned few things in near future that will bring the cost down, but that will take some time. 

Kindly help me keep running and developing this API. Thanks a lot for using my API, it feels good when your creation help other create their own projects.

<a href="https://www.buymeacoffee.com/meetdeveloper"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&amp;emoji=&amp;slug=meetdeveloper&amp;button_colour=5F7FFF&amp;font_colour=ffffff&amp;font_family=Poppins&amp;outline_colour=000000&amp;coffee_colour=FFDD00"></a>

## Related Projects

### [Dictionary Anywhere](https://github.com/meetDeveloper/Dictionary-Anywhere)

The **Dictionary Anywhere** extension helps you stay focused on what you are reading by eliminating the need to search for meaning, 
Double-clicking any word will view its definition in a small pop-up bubble. 
Now you never have to leave what you are reading to search for the meaning of the words you don't yet know.

Extension is available for [Google Chrome](https://chrome.google.com/webstore/detail/dictionary-anywhere/hcepmnlphdfefjddkgkblcjkbpbpemac/) and [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/dictionary-anyvhere).
##### Enjoy Reading Uninterrupted!!!

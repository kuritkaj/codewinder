# Tools

Tools are used by the ReAct Agent to accomplish one or more tasks.
Currently, tools are added to the context window of the LLM via the prompt, see ReActAgent#createPrompt.

## Javascript Evaluator

JavascriptEvaluator creates and executes an anonymous function based on a provided specification.
This works best with GPT4; GPT3.5 Turbo is great at writing code, but can't consistently get the format correct.

The key to this functionality is the prompt:

```text
Explain: ...
Plan:
1) ...
2) ...
3) ...
...
Code:
```javascript
// helper functions (only if needed, try to avoid them)
...
// main function after the helper functions
(async function() {{
    function yourMainFunctionName() {{
      // ...
    }}

    return await yourMainFunctionName();
}})();
```

Which was inspired by this project and research paper:
https://github.com/MineDojo/Voyager/blob/main/voyager/prompts/action_response_format.txt

## Web Browser

Provides indexing and searching an HTML page or PDF.

It takes a single url along with an indication of what to find on the page.
If no direction is provided, then a summary of the page will be returned.

Primary modification of the original is to add memory, the indexed page is stored to the MemoryStore.
Additionally, the original was modified to parse PDFs for processing same as HTML pages.

This tool is modified from the original version found here:
https://github.com/hwchase17/langchainjs/blob/main/langchain/src/tools/webbrowser.ts

## Web Search

Searches the web using Bing Search API.

This tool is only available if the Bing Search API key is provided. See the main readme for more details.

This tool returns 20 search results and then uses a vector search to return the top 4 scoring results.

This tool is modified from the original version found here:
https://github.com/hwchase17/langchainjs/blob/main/langchain/src/tools/bingserpapi.ts

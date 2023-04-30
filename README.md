# Codewinder
This provides a webchat interface over OpenAI's ChatGPT-3 API and LangChain's backend.  
The chat has history of the current interaction (refresh the page to clear the history),
a multistep agent which provides a way for the chat to break down an action into multiple steps,
and short-term memory for coordination between steps of a multi-step action.

## Getting Started

The server requires the following environment variables:
- OPENAI_API_KEY - which can be found [here](https://platform.openai.com/account/api-keys).

And optionally the following environment variables:
- BING_API_KEY - which can be found [here](https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/).
- SUPABASE_URL - which can be found [here](https://app.supabase.io/).
- SUPABASE_API_KEY - which can be found [here](https://app.supabase.io/).

Notes: 
* without the Bing Search key, the search will use the Web Browser tool for searches, which is less efficient.
* Supabase is experimental to add long-term memory to the autonomous agent.

### Running the Server

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributions

This repo is open to contributions. Please feel free to open a PR.  
Note: package manager is yarn.

## Inspirations

This repo borrows heavily from

- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [Chat-Langchainjs](https://github.com/sullivan-sean/chat-langchainjs) - for the frontend
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.
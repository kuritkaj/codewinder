# Codewinder
This provides a web chat interface over OpenAI's ChatGPT-3 API and LangChain's backend.  
The chat has history of the current interaction (refresh the page to clear the history),
a multistep agent which provides a way for the chat to break down an action into multiple steps,
and short-term memory for coordination between steps of a multi-step action.

## Demo
[Video demoing key functionality](https://share.descript.com/view/R70Rc6aQjBQ)

## Getting Started

The server requires the following environment variables:
- OPENAI_API_KEY - which can be found [here](https://platform.openai.com/account/api-keys).

And optionally the following environment variables:
- GPT4 - set to "true" or "false" depending on whether you want to use GPT-4 or GPT-3.5-turbo.
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

## Inspirations

With a few modest additions, most of this repo is based on the following repos:

- [Chat-Langchainjs](https://github.com/sullivan-sean/chat-langchainjs) - for the frontend
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.
- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangchainJS](https://github.com/hwchase17/langchainjs) - for the building blocks upon which these other projects are built.

## Advanced
### Supabase Setup

Run this script to setup the supabase database:

```sql
-- Enable the pgvector extension to work with embedding vectors
create extension vector;

-- Create a table to store your memories
create table memories (
  id bigserial primary key,
  content text, -- corresponds to Langchain's Document.pageContent
  metadata jsonb, -- corresponds to Langchain's Document.metadata
  embedding vector(1536) -- 1536 works for OpenAI embeddings, change if needed
);

-- Create a function to search for memories
create function match_memories (
  query_embedding vector(1536),
  match_count int
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (memories.embedding <=> query_embedding) as similarity
  from memories
  order by memories.embedding <=> query_embedding
  limit match_count;
end;
$$;
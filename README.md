# Codewinder
This provides a web chat interface over OpenAI's GPT-3/4 APIs and LangChain's backend.  
The chat has history of the current interaction (refresh the page to clear the history),
a multistep agent which provides a way for the chat to break down an action into multiple steps,
and short-term memory for coordination between steps of a multi-step action.

## Overview
See the wiki for more detail and discussion.

## Getting Started

The server requires the following environment variables:
- OPENAI_API_KEY - which can be found [here](https://platform.openai.com/account/api-keys).
  (Notebook: you must have GPT4 access; GPT4 is used for writing code)

And optionally the following environment variables:
- ZAPIER_NLA_API_KEY - which can be found [here](https://nla.zapier.com/docs/).
- BING_API_KEY - which can be found [here](https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/).
- SUPABASE_URL - which can be found [here](https://app.supabase.io/).
- SUPABASE_API_KEY - which can be found [here](https://app.supabase.io/).

Stack: 

* without the Bing Search key, the search will use the Web Browser tool for searches, which is less efficient.
* without the Supabase key, in-memory vectorstore is used and memories are not persisted between requests.
* the Zapier NLA key is amazing! read more here: https://blog.langchain.dev/langchain-zapier-nla/

### Running the Server

Then, run the development server:

```bash
next dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inspirations

With a few modest additions, most of this repo is based on the following repos:

- [Chat-Langchainjs](https://github.com/sullivan-sean/chat-langchainjs) - for the frontend
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend
- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangchainJS](https://github.com/hwchase17/langchainjs) - for the building blocks upon which these other projects are built
- [BrowserGPT](https://github.com/mayt/BrowserGPT) - provides tool for controlling local browser

## Advanced
### Supabase Setup

Run this script to setup the supabase database:
(This needs to be updated now with the latest release of stacks and notebooks).

```sql
-- Create stack table
create table stacks
(
    id         uuid                     default gen_random_uuid() not null
        primary key,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    owner_id   uuid                     default auth.uid(),
    name       text,
    notebooks  uuid[]
);

create policy "Enable all access for owners" on stacks
    as permissive
    for all
    to authenticated
    using (auth.uid() = owner_id);
    
-- Create notebook table
create table notebooks
(
    id         uuid                     default gen_random_uuid() not null
        constraint notes_pkey
        primary key,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    owner_id   uuid                     default auth.uid(),
    stack_id   uuid                                               not null,
    blocks     jsonb
);

create policy "Enable all access for owners" on notebooks
    as permissive
    for all
    to authenticated
    using (auth.uid() = owner_id);

-- Enable the pgvector extension to work with embedding vectors
create extension vector;

-- Create a table to store your memories
create table memories (
  id           bigserial primary key,
  owner_id     uuid                     default auth.uid(),
  content      text,                    -- corresponds to Langchain's Document.pageContent
  metadata     jsonb,                   -- corresponds to Langchain's Document.metadata
  embedding    vector(1536)             -- 1536 works for OpenAI embeddings, change if needed
);

create policy "Enable all access for owners" on memories
    as permissive
    for all
    to authenticated
    using (auth.uid() = owner_id);

-- Create a function to search for memories
create function match_memories (
  query_embedding vector(1536),
  match_count int,
  filter jsonb DEFAULT '{}'
) returns table (
  id           bigint,
  content      text,
  metadata     jsonb,
  similarity   float
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
  where metadata @> filter
  order by memories.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create a table to store your documents
create table knowledge (
  id           bigserial primary key,
  owner_id     uuid                     default auth.uid(),
  content      text,                    -- corresponds to Langchain's Document.pageContent
  metadata     jsonb,                   -- corresponds to Langchain's Document.metadata
  embedding    vector(1536)             -- 1536 works for OpenAI embeddings, change if needed
);

create policy "Enable all access for owners" on knowledge
    as permissive
    for all
    to authenticated
    using (auth.uid() = owner_id);

-- Create a function to search for knowledge
create function match_knowledge (
  query_embedding vector(1536),
  match_count int,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content      text,
  metadata     jsonb,
  similarity   float
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
    1 - (knowledge.embedding <=> query_embedding) as similarity
  from knowledge
  where metadata @> filter
  order by knowledge.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create a table to store your code/functions
create table code (
  id           bigserial primary key,
  owner_id     uuid                     default auth.uid(),
  content      text,                    -- corresponds to Langchain's Document.pageContent
  metadata     jsonb,                   -- corresponds to Langchain's Document.metadata
  embedding    vector(1536)             -- 1536 works for OpenAI embeddings, change if needed
);

create policy "Enable all access for owners" on code
    as permissive
    for all
    to authenticated
    using (auth.uid() = owner_id);

-- Create a function to search for code
create function match_code (
  query_embedding vector(1536),
  match_count int,
  filter jsonb DEFAULT '{}'
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
    1 - (code.embedding <=> query_embedding) as similarity
  from code
  where metadata @> filter
  order by code.embedding <=> query_embedding
  limit match_count;
end;
$$;

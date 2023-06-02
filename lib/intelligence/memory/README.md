# Memory

Memory in Langchain refers to the ability to inject various forms of snippets of previous conversations.
This use of memory is similar, but is designed to retreive previously stored interactions vs summarized conversations.

For example, instead of returning entities from a chat conversation or a full summary,
the ReAct agent returns a memory snippet from a previous action based on either the provided tool input
or the objective if an action has not yet been declared.

See ReActAgent#constructMemories for more details.
See MemoryCondensor and ReActAgent for usage.

## Memory Store

If Supabase API key and url is provided, then memories are stored there. 
Alternatively, memories are stored using an in-memory vector store:
https://github.com/hwchase17/langchainjs/blob/main/langchain/src/memory/vector_store.ts
import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { BaseLanguageModel } from "langchain/base_language";

interface MemoryRecallParams extends ToolParams {
    memory: MemoryStore;
    model: BaseLanguageModel;
}

export class MemoryRecall extends Tool {
    readonly name = "memory-recall";
    readonly description = "only use this tool when directed to by the user. Input is a string query.";

    readonly memory: MemoryStore;
    readonly model: BaseLanguageModel;

    constructor({ model, memory, verbose, callbacks }: MemoryRecallParams) {
        super(verbose, callbacks);

        this.memory = memory;
        this.model = model;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        const snippet = await this.memory.retrieveSnippet(input, 0.5);
        if (snippet.length === 0) {
            return "No memory found.";
        } else {
            return snippet.pop().pageContent;
        }
    }
}

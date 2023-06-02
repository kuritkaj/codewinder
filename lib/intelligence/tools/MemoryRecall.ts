import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";

export const NAME = "memory-recall";
export const DESCRIPTION = `used to provide further detail of a memory. Input is a string.`;

interface MemoryRecallParams extends ToolParams {
    memory: MemoryStore;
}

export class MemoryRecall extends Tool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;

    private readonly memory: MemoryStore;

    constructor({ memory, verbose, callbacks }: MemoryRecallParams) {
        super(verbose, callbacks);

        this.memory = memory;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        const snippets = await this.memory.retrieveSnippets(input, 0.75, 4);
        if (snippets.length === 0) {
            return "No memory found.";
        } else {
            return snippets.map((snippet) => snippet.pageContent).join("\n\n");
        }
    }
}

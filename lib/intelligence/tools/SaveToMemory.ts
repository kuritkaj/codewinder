import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";

interface SaveToMemoryParams extends ToolParams {
    memory: MemoryStore;
}

export class SaveToMemory extends Tool {
    readonly name = "save-to-memory";
    readonly description = "saves the provided input to memory for recall later.";

    readonly memory: MemoryStore;
    readonly returnDirect = true;

    constructor({ memory, verbose, callbacks }: SaveToMemoryParams) {
        super(verbose, callbacks);

        this.memory = memory;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        await this.memory.storeText(input);

        return "Memory saved."
    }
}

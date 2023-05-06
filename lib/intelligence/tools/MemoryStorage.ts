import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";

interface MemoryStorageParams extends ToolParams {
    memory: MemoryStore;
}

export class MemoryStorage extends Tool {
    readonly name = "memory-storage";
    readonly description = "saves the provided input to memory for recall later. " +
        "The input should include enough context to be easily retrievable in the future." +
        "Always follow using this tool with a response or another tool.";

    readonly memory: MemoryStore;

    constructor({ memory, verbose, callbacks }: MemoryStorageParams) {
        super(verbose, callbacks);

        this.memory = memory;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        await this.memory.storeText(input);

        return "Memory saved. Provide a response or select another tool to use."
    }
}

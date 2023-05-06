import { Tool, ToolParams } from "langchain/tools";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { StringPromptValue } from "langchain/prompts";
import { BaseLanguageModel } from "langchain/base_language";

interface MemoryStorageParams extends ToolParams {
    memory: MemoryStore;
    model: BaseLanguageModel;
}

export class MemoryStorage extends Tool {
    readonly name = "memory-storage";
    readonly description = "saves the provided input to memory for recall later. " +
        "The input should include enough context to be easily retrievable in the future." +
        "Always follow using this tool with a response or use another tool.";

    readonly memory: MemoryStore;
    readonly model: BaseLanguageModel;

    constructor({ model, memory, verbose, callbacks }: MemoryStorageParams) {
        super(verbose, callbacks);

        this.memory = memory;
        this.model = model;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        const prompt = `Rewrite this provided input to be easily recalled in the future: ${input}`;

        const res = await this.model.generatePrompt(
            [ new StringPromptValue(prompt) ],
            undefined,
            runManager?.getChild()
        );

        const memory = res.generations[0][0].text;

        await this.memory.storeText(memory);

        return "Memory saved."
    }
}

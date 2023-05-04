import { Tool } from "langchain/tools";
import { StringPromptValue } from "langchain/prompts";
import { BaseChatModel } from "langchain/chat_models";
import { CallbackManagerForToolRun } from "langchain/callbacks";

interface CreativeWriterInput {
    model: BaseChatModel;
}

export class CreativeWriter extends Tool {
    readonly name = "creative-writer";
    readonly description = "Capable of editing, formatting, and writing creative works. Provide a directive followed by the input string.";

    readonly model: BaseChatModel;
    readonly returnDirect = true;

    constructor(input: CreativeWriterInput) {
        super();

        this.model = input.model;
    }

    /** @ignore */
    async _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string> {
        const res = await this.model.generatePrompt(
            [ new StringPromptValue(input) ],
            undefined,
            runManager?.getChild()
        );

        return res.generations[0][0].text;
    }
}

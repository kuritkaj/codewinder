import { Tool, ToolParams } from "langchain/tools";
import { StringPromptValue } from "langchain/prompts";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

interface CreativeWriterParams extends ToolParams {
    model: BaseLanguageModel;
}

export class CreativeWriter extends Tool {
    readonly name = "creative-writer";
    readonly description = `Capable of editing, formatting, and writing creative works. 
        This writer does not have access to the original objective or any of the intermediate steps.
        Input should be all necessary information to complete the task including formatting instructions such as using GFM markdown.`;

    readonly model: BaseLanguageModel;
    readonly returnDirect = true;

    constructor({ model, verbose, callbacks }: CreativeWriterParams) {
        super(verbose, callbacks);

        this.model = model;
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

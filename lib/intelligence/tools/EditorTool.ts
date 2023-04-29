import { Tool } from "langchain/tools";
import { BaseChatModel } from "langchain/chat_models";
import { Callbacks } from "langchain/callbacks";
import { EditorChain } from "@/lib/intelligence/chains/editor/EditorChain";

const DESCRIPTION = `
This tool can be used to format a response to meet the objective.
`;

interface EditorToolInput {
    model: BaseChatModel;
    verbose?: boolean;
    callbacks?: Callbacks;
}

export class EditorTool extends Tool {
    name = "editor";

    description = DESCRIPTION;

    readonly llm: BaseChatModel;

    constructor({ model, verbose, callbacks }: EditorToolInput) {
        super(verbose, callbacks);

        this.llm = model;
    }

    async _call(input: string): Promise<string> {
        return await EditorTool.runAgent(this.llm, this.callbacks, input);
    }

    static async runAgent(model: BaseChatModel, callbacks: Callbacks, input: string): Promise<string> {
        const agent = EditorChain.makeChain({
            model,
            callbacks
        });

        return await agent.evaluate({ context: input, objective: "" });
    }
}

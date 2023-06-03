import { PromptTemplate } from "langchain/prompts";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/callbacks";
import { BaseLanguageModel } from "langchain/base_language";

export const CONTEXT_INPUT = "context";
export const CONTINUE_RESPONSE = "Thinking...";
export const FINAL_RESPONSE = "Final Response";
export const MEMORY = "Memory";
export const MEMORY_INPUT = "memory";
export const OBJECTIVE = "Objective";
export const OBJECTIVE_INPUT = "objective";

export const GUIDANCE = `
You are an AI assistant with the responsibility to determine if a stated objective can be easily and factually responded to.

This is the prior conversation:
\"\"\"{${ CONTEXT_INPUT }}\"\"\"

Here is the stated ${ OBJECTIVE }:
\"\"\"{${ OBJECTIVE_INPUT }}\"\"\"

Which sparked this ${ MEMORY }:
\"\"\"{${ MEMORY_INPUT }}\"\"\" 

Is the ${ OBJECTIVE }:
* a casual greeting or conversation
* a request to write, edit, debug, or to explain code, software, a function, or a program
* something that requires a creative response such as a joke or a poem
If so, then respond with \`${ FINAL_RESPONSE }:\` followed by your response.

Alternatively, does the ${ OBJECTIVE }:
* require more than one step or is comprised of multiple parts or directions
* make use of one or more complex calculations
* require executing code in a secure environment
* request or require searching or browsing the internet, web, or a database, etc.
* require access to one or more tools to accomplish the task
* make use of a memory that is helpful, but that does not fully address the ${ OBJECTIVE }
If so, then respond with \`${ CONTINUE_RESPONSE }\` without further explanation.

Note: if making use of a memory, pay attention to the created_at timestamp. 
If the objective requires time-sensitive information, then the memory may be out of date.

All other cases should be responded to with \`${ CONTINUE_RESPONSE }\` without further explanation.
`;

interface DirectorInput {
    model: BaseLanguageModel;
    callbacks?: Callbacks;
}

export class Director extends LLMChain {

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    static makeChain({ model, callbacks }: DirectorInput): Director {
        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        return new Director({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async evaluate({ context, memory, objective }: { context: string; memory: string; objective: string }): Promise<string> {
        const completion = await this.call({
            context,
            memory,
            objective
        });
        return completion.text;
    }
}
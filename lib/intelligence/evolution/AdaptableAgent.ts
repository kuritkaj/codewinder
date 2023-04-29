import { Optional } from "langchain/dist/types/type-utils";
import {
    Agent, AgentActionOutputParser,
    AgentArgs,
    AgentInput,
    OutputParserArgs
} from "langchain/agents";
import { Tool } from "langchain/tools";
import { PromptTemplate, renderTemplate } from "langchain/prompts";
import { FORMAT_INSTRUCTIONS, PREFIX, SUFFIX } from "@/lib/intelligence/evolution/prompts";
import { BaseLanguageModel } from "langchain/base_language";
import { LLMChain } from "langchain/chains";

export interface ZeroShotCreatePromptArgs {
    /** String to put after the list of tools. */
    suffix?: string;
    /** String to put before the list of tools. */
    prefix?: string;
    /** List of input variables the final prompt will expect. */
    inputVariables?: string[];
}

export type AdaptableAgentInput = Optional<AgentInput, "outputParser">;

/**
 * Agent for the MRKL chain.
 * @augments Agent
 */
export class AdaptableAgent extends Agent {
    constructor(input: AdaptableAgentInput) {
        const outputParser =
            input?.outputParser ?? AdaptableAgent.getDefaultOutputParser();
        super({ ...input, outputParser });
    }

    _agentType() {
        return "zero-shot-react-description" as const;
    }

    observationPrefix() {
        return "Observation: ";
    }

    llmPrefix() {
        return "Thought:";
    }

    static getDefaultOutputParser(fields?: OutputParserArgs) {
        return new AdaptableAgentOutputParser(fields);
    }

    static validateTools(tools: Tool[]) {
        const invalidTool = tools.find((tool) => !tool.description);
        if (invalidTool) {
            const msg =
                `Got a tool ${invalidTool.name} without a description.` +
                ` This agent requires descriptions for all tools.`;
            throw new Error(msg);
        }
    }

    /**
     * Create prompt in the style of the zero shot agent.
     *
     * @param tools - List of tools the agent will have access to, used to format the prompt.
     * @param args - Arguments to create the prompt with.
     * @param args.suffix - String to put after the list of tools.
     * @param args.prefix - String to put before the list of tools.
     * @param args.inputVariables - List of input variables the final prompt will expect.
     */
    static createPrompt(tools: Tool[], args?: ZeroShotCreatePromptArgs) {
        const {
            prefix = PREFIX,
            suffix = SUFFIX,
            inputVariables = ["input", "agent_scratchpad"],
        } = args ?? {};
        const toolStrings = tools
            .map((tool) => `${tool.name}: ${tool.description}`)
            .join("\n");

        const toolNames = tools.map((tool) => tool.name);

        const formatInstructions = renderTemplate(FORMAT_INSTRUCTIONS, "f-string", {
            tool_names: toolNames,
        });

        const template = [prefix, toolStrings, formatInstructions, suffix].join(
            "\n\n"
        );

        return new PromptTemplate({
            template,
            inputVariables,
        });
    }

    static fromLLMAndTools(
        llm: BaseLanguageModel,
        tools: Tool[],
        args?: ZeroShotCreatePromptArgs & AgentArgs
    ) {
        AdaptableAgent.validateTools(tools);
        const prompt = AdaptableAgent.createPrompt(tools, args);
        const outputParser =
            args?.outputParser ?? AdaptableAgent.getDefaultOutputParser();
        const chain = new LLMChain({
            prompt,
            llm,
            callbacks: args?.callbacks ?? args?.callbackManager,
        });

        return new AdaptableAgent({
            llmChain: chain,
            allowedTools: tools.map((t) => t.name),
            outputParser,
        });
    }
}

export const FINAL_ANSWER_ACTION = "Final Answer:";
export class AdaptableAgentOutputParser extends AgentActionOutputParser {
    finishToolName: string;

    constructor(fields?: OutputParserArgs) {
        super();
        this.finishToolName = fields?.finishToolName || FINAL_ANSWER_ACTION;
    }

    async parse(text: string) {
        if (text.includes(this.finishToolName)) {
            const parts = text.split(this.finishToolName);
            const output = parts[parts.length - 1].trim();
            return {
                returnValues: { output },
                log: text,
            };
        }

        const match = /Action: (.*)\nAction Input: (.*)/s.exec(text);
        if (!match) {
            throw new Error(`Could not parse LLM output: ${text}`);
        }

        return {
            tool: match[1].trim(),
            toolInput: match[2].trim().replace(/^"+|"+$/g, "") ?? "",
            log: text,
        };
    }

    getFormatInstructions(): string {
        return FORMAT_INSTRUCTIONS;
    }
}
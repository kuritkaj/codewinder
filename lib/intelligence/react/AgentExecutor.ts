import { BaseChain, ChainInputs, SerializedLLMChain } from "langchain/chains";
import { Tool } from "langchain/tools";
import { BaseSingleActionAgent, StoppingMethod } from "langchain/agents";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { CallbackManagerForChainRun } from "langchain/callbacks";

export interface AgentExecutorInput extends ChainInputs {
    agent: BaseSingleActionAgent;
    tools: Tool[];
    returnIntermediateSteps?: boolean;
    maxIterations?: number;
    earlyStoppingMethod?: StoppingMethod;
}

/**
 * A chain managing an agent using tools.
 * @augments BaseChain
 */
export class AgentExecutor extends BaseChain {
    readonly agent: BaseSingleActionAgent;
    readonly earlyStoppingMethod: StoppingMethod = "force";
    readonly maxIterations?: number = 15;
    readonly returnIntermediateSteps: boolean = false;
    readonly tools: Tool[];

    get inputKeys() {
        return this.agent.inputKeys;
    }

    get outputKeys() {
        return this.agent.returnValues;
    }

    constructor(input: AgentExecutorInput) {
        super(
            input.memory,
            input.verbose,
            input.callbacks
        );
        this.agent = input.agent;
        this.tools = input.tools;
        if (this.agent._agentActionType() === "multi") {
            for (const tool of this.tools) {
                if (tool.returnDirect) {
                    throw new Error(
                        `Tool with return direct ${ tool.name } not supported for multi-action agent.`
                    );
                }
            }
        }
        this.returnIntermediateSteps =
            input.returnIntermediateSteps ?? this.returnIntermediateSteps;
        this.maxIterations = input.maxIterations ?? this.maxIterations;
        this.earlyStoppingMethod =
            input.earlyStoppingMethod ?? this.earlyStoppingMethod;
    }

    /** Create from agent and a list of tools. */
    static fromAgentAndTools(fields: AgentExecutorInput): AgentExecutor {
        return new AgentExecutor(fields);
    }

    private shouldContinue(iterations: number): boolean {
        return this.maxIterations === undefined || iterations < this.maxIterations;
    }

    /** @ignore */
    async _call(
        inputs: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const toolsByName = Object.fromEntries(
            this.tools.map((t) => [ t.name.toLowerCase(), t ])
        );
        let steps: AgentStep[] = [];
        let iterations = 0;

        const getOutput = async (finishStep: AgentFinish) => {
            const { returnValues } = finishStep;
            const additional = await this.agent.prepareForOutput(returnValues, steps);

            if (this.returnIntermediateSteps) {
                return { ...returnValues, intermediateSteps: steps, ...additional };
            }
            await runManager?.handleAgentEnd(finishStep);
            return { ...returnValues, ...additional };
        };

        while (this.shouldContinue(iterations)) {
            iterations += 1;

            const output = await this.agent.plan(
                steps,
                inputs,
                runManager?.getChild()
            );

            // Check if the agent has finished
            if ("returnValues" in output) {
                return getOutput(output);
            }

            let actions: AgentAction[];
            if (Array.isArray(output)) {
                actions = output as AgentAction[];
            } else {
                actions = [ output as AgentAction ];
            }

            const newSteps = await Promise.all(
                actions.map(async (action) => {
                    await runManager?.handleAgentAction(action);

                    const tool = toolsByName[action.tool?.toLowerCase()];
                    const observation = tool
                        ? await tool.call(action.toolInput, runManager?.getChild())
                        : `${ action.tool } is not a valid tool, try another one.`;

                    return { action, observation };
                })
            );

            steps.push(...newSteps);

            const lastStep = steps[steps.length - 1];
            const lastTool = toolsByName[lastStep.action.tool?.toLowerCase()];

            if (lastTool?.returnDirect) {
                return getOutput({
                    returnValues: { [this.agent.returnValues[0]]: lastStep.observation },
                    log: "",
                });
            }
        }

        const finish = await this.agent.returnStoppedResponse(
            this.earlyStoppingMethod,
            steps,
            inputs
        );

        return getOutput(finish);
    }

    _chainType() {
        return "agent_executor" as const;
    }

    serialize(): SerializedLLMChain {
        throw new Error("Cannot serialize an AgentExecutor");
    }
}
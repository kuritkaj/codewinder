import { BaseChain, ChainInputs, SerializedLLMChain } from "langchain/chains";
import { BaseMultiActionAgent, BaseSingleActionAgent } from "langchain/dist/agents/agent";
import { Tool } from "langchain/tools";
import { StoppingMethod } from "langchain/agents";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { CallbackManagerForChainRun } from "langchain/callbacks";

export interface AgentExecutorInput extends ChainInputs {
    agent: BaseSingleActionAgent | BaseMultiActionAgent;
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
    agent: BaseSingleActionAgent | BaseMultiActionAgent;
    tools: Tool[];
    returnIntermediateSteps = false;
    maxIterations?: number = 15;
    earlyStoppingMethod: StoppingMethod = "force";

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
                        `Tool with return direct ${tool.name} not supported for multi-action agent.`
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
            this.tools.map((t) => [t.name.toLowerCase(), t])
        );
        const steps: AgentStep[] = [];
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

            let output;
            try {
                output = await this.agent.plan(
                    steps,
                    inputs,
                    runManager?.getChild()
                );
            } catch (e) {
                console.log("AgentExecutor error", e);
                continue;
            }

            // Check if the agent has finished
            if ("returnValues" in output) {
                if (output.returnValues?.output) {
                    return getOutput(output);
                } else {
                    continue;
                }
            }

            let actions: AgentAction[];
            if (Array.isArray(output)) {
                actions = output as AgentAction[];
            } else {
                actions = [output as AgentAction];
            }

            const newSteps = await Promise.all(
                actions.map(async (action) => {
                    await runManager?.handleAgentAction(action);

                    const tool = toolsByName[action.tool?.toLowerCase()];
                    const observation = tool
                        ? await tool.call(action.toolInput, runManager?.getChild())
                        : `${action.tool} is not a valid tool, try another one.`;

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
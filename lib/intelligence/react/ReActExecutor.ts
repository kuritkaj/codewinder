// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/executor.ts

import {BaseChain, SerializedLLMChain} from "langchain/chains";
import {Tool} from "langchain/tools";
import {StoppingMethod} from "langchain/agents";
import {AgentAction, AgentFinish, AgentStep, ChainValues} from "langchain/schema";
import {CallbackManagerForChainRun} from "langchain/callbacks";
import {ReActAgent} from "@/lib/intelligence/react/ReActAgent";
import {BaseLanguageModel} from "langchain/base_language";
import {MultistepExecutor} from "@/lib/intelligence/multistep/MultistepExecutor";
import {MemoryStore} from "@/lib/intelligence/memory/MemoryStore";

export type AgentContinue = {
    log: string;
};

export interface ReActExecutorInput {
    agent: ReActAgent;
    creative: BaseLanguageModel;
    earlyStoppingMethod?: StoppingMethod;
    maxIterations?: number;
    memory: MemoryStore;
    model: BaseLanguageModel;
    returnIntermediateSteps?: boolean;
    tools: Tool[];
}

/**
 * A chain managing an agent using tools.
 * @augments BaseChain
 */
export class ReActExecutor extends BaseChain {
    private readonly agent: ReActAgent;
    private readonly earlyStoppingMethod: StoppingMethod = "force";
    private readonly maxIterations?: number = 15;
    private readonly returnIntermediateSteps: boolean = false;
    private readonly tools: Tool[];

    get inputKeys() {
        return this.agent.inputKeys;
    }

    get outputKeys() {
        return this.agent.returnValues;
    }

    constructor({
                    agent,
                    creative,
                    earlyStoppingMethod,
                    maxIterations,
                    memory,
                    model,
                    returnIntermediateSteps,
                    tools
                }: ReActExecutorInput) {
        super();
        const multistep = new MultistepExecutor({
            creative,
            maxIterations,
            model,
            memory,
            tools
        });
        const toolset = [...tools, multistep];

        this.agent = agent;
        this.tools = toolset;

        this.returnIntermediateSteps =
            returnIntermediateSteps ?? this.returnIntermediateSteps;
        this.maxIterations = maxIterations ?? this.maxIterations;
        this.earlyStoppingMethod =
            earlyStoppingMethod ?? this.earlyStoppingMethod;
    }

    /** Create from agent and a list of tools. */
    static fromAgentAndTools({
                                 agent,
                                 creative,
                                 earlyStoppingMethod,
                                 maxIterations,
                                 memory,
                                 model,
                                 returnIntermediateSteps,
                                 tools
                             }: ReActExecutorInput): ReActExecutor {
        return new ReActExecutor({
            agent,
            creative,
            earlyStoppingMethod,
            maxIterations,
            memory,
            model,
            returnIntermediateSteps,
            tools
        });
    }

    private shouldContinue(iterations: number): boolean {
        return this.maxIterations === undefined || iterations < this.maxIterations;
    }

    async _call(
        inputs: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const toolsByName = Object.fromEntries(
            this.tools.map((t) => [t.name.toLowerCase(), t])
        );
        let steps: AgentStep[] = [];
        let iterations = 0;

        const getOutput = async (finishStep: AgentFinish) => {
            const {returnValues} = finishStep;
            const additional = await this.agent.prepareForOutput(returnValues, steps);

            if (this.returnIntermediateSteps) {
                return {...returnValues, intermediateSteps: steps, ...additional};
            }
            await runManager?.handleAgentEnd(finishStep);
            return {...returnValues, ...additional};
        };

        // Loop until the number of iterations are met, or the plan returns with AgentFinish.
        while (this.shouldContinue(iterations)) {
            // Prepare the inputs
            const newInputs = await this.agent.prepareInputs(inputs, steps);

            // Evaluate the inputs to determine if the agent can exit early.
            const evaluation = await this.agent.evaluateInputs(newInputs, steps, runManager?.getChild());

            // Check if the agent has finished
            if ("returnValues" in evaluation) {
                return getOutput(evaluation);
            }

            // Execute the plan with the new inputs
            const output = await this.agent.plan(
                steps,
                newInputs,
                runManager?.getChild()
            );

            // Check if the agent has finished
            if ("returnValues" in output) {
                return getOutput(output);
            }

            // If not, then double-check the work to ensure the plan is sound.
            const newOutput = await this.agent.evaluateOutputs(output, steps, newInputs, runManager?.getChild());

            // Check if the agent has finished
            if ("returnValues" in newOutput) {
                return getOutput(newOutput);
            }

            // If the output is an array, then we have multiple actions to execute.
            let newActions: AgentAction[];
            if (Array.isArray(newOutput)) {
                newActions = newOutput as AgentAction[];
            } else {
                newActions = [newOutput as AgentAction];
            }

            // Here, we execute the actions and gather the observations.
            const newSteps = await Promise.all(
                newActions.map(async (action) => {
                    await runManager?.handleAgentAction(action);

                    const tool = toolsByName[action.tool?.toLowerCase()];
                    const observation = tool
                        ? await tool.call(action.toolInput, runManager?.getChild())
                        : `${action.tool} is not a valid tool, try another one.`;

                    return {action, observation};
                })
            );

            // This prior action observations are added to the previous steps.
            steps.push(...newSteps);

            const lastStep = steps[steps.length - 1];
            const lastTool = toolsByName[lastStep.action.tool?.toLowerCase()];

            // If the last tool returns directly, we return that observation.
            // Given this is positional, that would mean any multi-action observations are ignored.
            if (lastTool?.returnDirect) {
                return getOutput({
                    returnValues: {[this.agent.returnValues[0]]: lastStep.observation},
                    log: "",
                });
            }

            iterations += 1;
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
import { BaseChain, ChainInputs, SerializedLLMChain } from "langchain/chains";
import { Tool } from "langchain/tools";
import { StoppingMethod } from "langchain/agents";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { CallbackManagerForChainRun } from "langchain/callbacks";
import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";

export interface AgentExecutorInput extends ChainInputs {
    agent: ReActAgent;
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
    readonly agent: ReActAgent;
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

    constructor({
                    agent,
                    callbacks,
                    earlyStoppingMethod,
                    maxIterations,
                    memory,
                    returnIntermediateSteps,
                    tools,
                    verbose
                }: AgentExecutorInput) {
        super(
            memory,
            verbose,
            callbacks
        );
        this.agent = agent;
        this.tools = tools;
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
            returnIntermediateSteps ?? this.returnIntermediateSteps;
        this.maxIterations = maxIterations ?? this.maxIterations;
        this.earlyStoppingMethod =
            earlyStoppingMethod ?? this.earlyStoppingMethod;
    }

    /** Create from agent and a list of tools. */
    static fromAgentAndTools({
                                 agent,
                                 callbacks,
                                 earlyStoppingMethod,
                                 maxIterations,
                                 memory,
                                 returnIntermediateSteps,
                                 tools,
                                 verbose
                             }: AgentExecutorInput): AgentExecutor {
        return new AgentExecutor({
            agent,
            callbacks,
            earlyStoppingMethod,
            maxIterations,
            memory,
            returnIntermediateSteps,
            tools,
            verbose
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

        // Loop until the number of iterations are met, or the plan returns with AgentFinish.
        while (this.shouldContinue(iterations)) {
            iterations += 1;

            // Prepare the inputs
            const newInputs = await this.agent.prepareInputs(inputs, steps);

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

            // The agent returned with an action or a list of actions.
            let actions: AgentAction[];
            if (Array.isArray(output)) {
                actions = output as AgentAction[];
            } else {
                actions = [ output as AgentAction ];
            }

            // Here, we execute the actions and gather the observations.
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

            // This prior action observations are added to the previous steps.
            steps.push(...newSteps);

            const lastStep = steps[steps.length - 1];
            const lastTool = toolsByName[lastStep.action.tool?.toLowerCase()];

            // If the last tool returns directly, we return that observation.
            // Given this is positional, that would mean any multi-action observations are ignored.
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
// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/agent.ts

import {AgentFinish, AgentStep, ChainValues} from "langchain/schema";
import {CallbackManager} from "langchain/callbacks";
import {StoppingMethod} from "langchain/agents";

export abstract class BaseAgent {

    abstract get inputKeys(): string[];

    get returnValues(): string[] {
        return ["output"];
    }

    /**
     * Return response when agent has been stopped due to max iterations
     */
    returnStoppedResponse(
        earlyStoppingMethod: StoppingMethod,
        _steps: AgentStep[],
        _inputs: ChainValues,
        _callbackManager?: CallbackManager
    ): Promise<AgentFinish> {
        if (earlyStoppingMethod === "force") {
            return Promise.resolve({
                returnValues: { output: "Agent stopped due to max iterations." },
                log: "",
            });
        }

        throw new Error(`Invalid stopping method: ${earlyStoppingMethod}`);
    }

    /**
     * Prepare the agent for output, if needed
     */
    async prepareForOutput(
        _returnValues: AgentFinish["returnValues"],
        _steps: AgentStep[]
    ): Promise<AgentFinish["returnValues"]> {
        return {};
    }
}

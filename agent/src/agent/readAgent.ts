import { z } from "zod";
import { model } from "../utils/model";
import { agentState } from "../utils/state";
import { tool } from "@langchain/core/tools";
import { agentKit } from "../utils/solanaAgent";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  SolanaBalanceTool,
  SolanaFetchPriceTool,
} from "solana-agent-kit/dist/langchain";

const readGraph = createReactAgent({
  llm: model,
  tools: [new SolanaBalanceTool(agentKit), new SolanaFetchPriceTool(agentKit)],
});

export const readNode = async (state: typeof agentState.State) => {
  const { messages } = state;
  const result = await readGraph.invoke({ messages });
  return { messages: [...result.messages] };
};

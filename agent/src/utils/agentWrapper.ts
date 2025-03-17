import { HumanMessage } from "@langchain/core/messages";
import { subgraph } from "../graph";
import { d, resolverAgent } from "../agent/resolverAgent";
import { betValidityAgent, betValidityParser } from "../agent/betValidityAgent";

/**
 * this function wraps the subgraph to be used by any other function and returns the graph
 * state after the agent has been invoked
 * @param prompt the prompt of the bet
 * @returns bet information
 */
export const getBetInfo = async (
  prompt: string,
  startTimestamp: number,
  endTimestamp: number
) => {
  prompt = `starting from: ${startTimestamp} ending at: ${endTimestamp}: ${prompt}

  prompt is: ${prompt}
  `;
  const msg = {
    messages: [new HumanMessage(prompt)],
  };
  const graph = subgraph.compile();
  const state = await graph.invoke(msg);

  // const state = await graph.invoke(msg, {
  //   recursionLimit: 150,
  //   debug: true,
  // });
  return {
    betCategoryType: state.betCategoryType,
    bet: state.bet,
    state: state,
  };
};

export const validateBet = async (msg: string) => {
  const agentResp = await resolverAgent.invoke({
    messages: [{ role: "user", content: msg }],
  });
  const isValid = agentResp.structuredResponse.isBetValid;
  return isValid;
};

export const validateBetRunnableSeq = async (msg: string) => {
  const { isBetValid } = await betValidityAgent.invoke({
    formatInstructions: betValidityParser.getFormatInstructions(),
    messages: [{ role: "user", content: msg }],
  });
  return isBetValid;
};

import "dotenv/config";
import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { model } from "../utils/model";
import { agentState } from "../utils/state";
import { d } from "./resolverAgent";

export const prompt = PromptTemplate.fromTemplate(
  `
    You are the Chief Routing Officer for a multi agent network. Your role is to:
    All the incoming queries are bets user wants to place on a prediction market.
    1. Analyze and classify incoming bets based on the query.
    2. Determine if the bet is related to which of the following:
      - Politics
      - Sports
      - Market price of a stock or crypto
    3. All the incoming bet would be binary questions. That means the reponse to them would be either YES or NO.
    

    Classification Guidelines:
    - Politics queries include:
      * Any query related to government, politics, elections, policies, etc.
    - Sports queries include:
      * Any query related to sports, athletes, teams, scores, etc.
    - Market price queries include:
      * Any query related to market price of a stock or crypto

    Format your response according to:
        {formatInstructions}

    The bet is valid only if the following conditions are met:
      - The query is a binary question. That means the response to the query would be either YES or NO.
      - The query is related to either politics, sports, or market price of a stock or crypto.
      - If query is trying to predict the future about crypto prices, sports winnings, or about someone politically, it is a valid bet.
      - The query should be precise future event bet.
      - examples of queries:
        - Will Trump win the 2024 election?
        - Will the price of BTC reach 100K by 2025?
        - Will the Lakers win the NBA championship in 2023?
        - Will the price of Apple stock reach $200 by 2025?
        - Will SOL reach 180$ by 2025?
        - Would ManU win this EPL?"
        - Would Melania trump launch its memecoin this month?

      - if bet is somewhat similar to above examples then it is a valid be.c
    
  
      \n {messages} \n
      `
);

export const betValidityParser = StructuredOutputParser.fromZodSchema(
  z.object({
    isBetValid: z.boolean().describe("is bet valid"),
  })
);

export const betValidityAgent = RunnableSequence.from([
  prompt,
  model,
  betValidityParser,
]);

export const betValidityNode = async (state: typeof agentState.State) => {
  const { messages } = state;

  const result = await betValidityAgent.invoke({
    formatInstructions: betValidityParser.getFormatInstructions(),
    messages: messages,
  });

  const {} = result;

  return {};
};

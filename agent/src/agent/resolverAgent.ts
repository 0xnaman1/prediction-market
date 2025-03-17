import { model } from "../utils/model";
import { BetCategoryType, agentState } from "../utils/state";
import {
  AnnotationRoot,
  BinaryOperatorAggregate,
  Command,
  Messages,
} from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseMessage } from "@langchain/core/messages";
import { unknown, z } from "zod";

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";

export const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
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

    The bet is valid only if the following conditions are met:
      - The query is a binary question. That means the response to the query would be either YES or NO.
      - The query is related to either politics, sports, or market price of a stock or crypto.
      - If query is not trying to predict the future, it is not a valid bet.
      - The query should be precise future event bet.
      - examples of queries:
        - Will Trump win the 2024 election?
        - Will the price of BTC reach 100K by 2025?
        - Will the Lakers win the NBA championship in 2023?
        - Will the price of Apple stock reach $200 by 2025?
        - Will SOL reach 180$ by 2025?
      - if bet is somewhat similar to above examples then it is a valid bet i.e isValidBet = true else false.
    
    use the prompt given to you as bet and classify it based on the above guidelines and output the structured data accordingly
    i.e isBetValid in structured data represents whether the bet is valid or not.

    `,
  ],
  new MessagesPlaceholder("messages"),
]);

export const d = z.object({
  type_: BetCategoryType,
  isBetValid: z.boolean().describe("bet is valid based on parms or not."),
});

// const agent = RunnableSequence.from([prompt, model, parser]);
export const resolverAgent = createReactAgent<
  AnnotationRoot<{
    messages: BinaryOperatorAggregate<BaseMessage[], Messages>;
  }>,
  z.infer<typeof d>
>({
  llm: model,
  tools: [],
  responseFormat: d,
  prompt: prompt,
});

// const resolverAgentExecuter = new AgentExecutor({
//   agent: resolverAgent,

// });

export const resolverNode = async (state: typeof agentState.State) => {
  const { messages } = state;

  const result = await resolverAgent.invoke({
    messages: messages,
  });
  const { type_ } = result.structuredResponse;
  return new Command({
    update: {
      betCategoryType: type_,
      // messages: messages,
    },
    goto: "extractor",
  });
};

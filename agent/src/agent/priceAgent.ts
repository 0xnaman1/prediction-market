import { z } from "zod";
import { model } from "../utils/model";
import { agentState } from "../utils/state";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { get_crypto_price } from "../tools/getPrice";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";

const pricePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a crypto price tracker that helps user get the price of any crypto currency.
    The incoming user queries would always be binary questions. That means the reponse to them would be either YES or NO.
    So always answer in either YES or NO.

          
          You have access to the following tools:
          - get_crypto_price: Find the price of a token using its symbol 
    
          You must obtain the symbol from the query of the user. Symbol can be for example
          - BTC
          - SOL
          - XRP
          etc. 
          
          When processing requests:
          1. Extract the cryptocurrency symbol from the user's query
          2. Use the get_crypto_price tool with the extracted symbol
          3. Always answer in either YES or NO.
          Always use uppercase symbols when querying prices.
          `,
  ],
  new MessagesPlaceholder("messages"),
]);

const priceGraph = createReactAgent({
  llm: model,
  tools: [get_crypto_price],
  stateModifier: pricePrompt,
});

export const priceNode = async (state: typeof agentState.State) => {
  const { messages } = state;
  const result = await priceGraph.invoke({ messages });
  return { messages: [...result.messages] };
};

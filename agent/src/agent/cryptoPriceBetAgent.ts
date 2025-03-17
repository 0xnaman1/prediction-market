import { z } from "zod";
import { model } from "../utils/model";
import { BetResolutionResult, agentState } from "../utils/state";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { get_ohlv_data } from "../tools/getOHLC";
import {} from "../tools/getUnixTimestamp";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Command, END } from "@langchain/langgraph";

const pricePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a bet resolver i.e I give you a prompt like 
      "starting from 25th september: will the price of BTC be above 50k USD in the next 24 hours?" or
      "will SOL reach the 180$ by 25th september", 
      and your goal is to fetch the OHLV data of the crypto price within the time of bet start and the expiry time and return wither YES, NO or NOT_RESOLVED check instructions below.

        You have access to the following tools:
        - get_ohlv_data: To get the OHLV data of a crypto asset using it's symbol, the symbol must end with USDT, interval must passed based on the below criterion and startTime and endTime must be passed in milliseconds unix timestamp.


        For passing the interval, you can use the following values "1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"
        - if the the time between bet start and bet expiry is 
          - less than 1 hour, use "1m",
          - less than 24 hour use "1h",
          - less than 1 month use "1d",
  
        You must obtain the symbol from the query of the user. Symbol can be for example
        - BTC
        - SOL
        - XRP
        etc. 
        end the symbol with USDT for example for BTC, the symbol would be BTCUSDT

        the tool get_ohlv_data return 
        '''
        [
          1499040000000, // Open time
          "0.01634790", // Open
          "0.80000000", // High
          "0.01575800", // Low
          "0.01577100", // Close
          "148976.11427815", // Volume
          1499644799999, // Close time
          "2434.19055334", // Quote asset volume
          308, // Number of trades
          "1756.87402397", // Taker buy base asset volume
          "28.46694368", // Taker buy quote asset volume
          "17928899.62484339", // Ignore.
        ];
        '''

        you need to then find the max value our of Open, High, Low, Close and compare it with the target price and return YES if the max value is greater than the target price else NO.

        When processing requests:
        1. Extract the cryptocurrency symbol from the user's query, and add USDT at the end of the symbol
        2. Using startTimestamp and endTimestamp from the bet, get the OHLV data of the crypto asset using the get_ohlv_data tool
        6. Use the get_ohlv_data tool with the extracted symbol and interval and bet's start timestamp and end timestamp in milliseconds.
        7. Always answer in either YES, NO.
          `,
  ],
  new MessagesPlaceholder("messages"),
]);

export const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    isPoliticsQuery: z.boolean().describe("Query is related to politics"),
    isSportsQuery: z.boolean().describe("Query is related to sports"),
    isMarketPriceQuery: z
      .boolean()
      .describe("Query is related to market price of a stock or crypto"),
  })
);

const cryptoPriceBetAgent = createReactAgent({
  llm: model,
  tools: [get_ohlv_data],
  stateModifier: pricePrompt,
  responseFormat: z.object({
    resolvedAnswer: BetResolutionResult,
  }),
});

export const cryptoPriceBetNode = async (state: typeof agentState.State) => {
  const { messages } = state;
  const result = await cryptoPriceBetAgent.invoke({
    messages: messages,
  });

  return new Command({
    update: {
      messages: [...result.messages],
      bet: {
        ...state.bet,
      },
      resolution: result.structuredResponse.resolvedAnswer,
    },
    goto: END,
  });
};

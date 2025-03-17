import { model } from "../utils/model";
import { BetType, agentState } from "../utils/state";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  get_current_timestamp,
  is_bet_expired,
} from "../tools/getUnixTimestamp";
import {
  AnnotationRoot,
  BinaryOperatorAggregate,
  Command,
  END,
  Messages,
} from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    You are an agent responsible to validate basic info about bet prompts, these prompts are bets user wants to place on
    our prediction marketplace.

    You have access to the following tools:
        - get_current_timestamp: To get the current unix timestamp
        - is_bet_expired: To check if the bet is expired or not.
    
    Format of the bet
        - 'starting from <start time> ending at <end time>  prompt is: <something will happen by some time>'
    
    steps to follow: 
        - take the bet's start timestamp and end timestamp from prompt, bet's start timestamp is given by number after starting from and end timestamp is given by number after ending at.
        - get current timestamp.
        - check if the bet is expired or not.
    Pass all the timestamps should be in milliseconds.
      `,
  ],
  new MessagesPlaceholder("messages"),
]);

// const vPrompt = PromptTemplate.fromTemplate(
//   `isBetExpired: true if bet end time is greater than current unix timestamp false otherwise`
// );

// (state: typeof MessagesAnnotation.State, config: LangGraphRunnableConfig) => BaseMessageLike[]) | ((state: typeof MessagesAnnotation.State, config: LangGraphRunnableConfig) => Promise<BaseMessageLike[]>) | Runnable;

const agent = createReactAgent<
  AnnotationRoot<{
    messages: BinaryOperatorAggregate<BaseMessage[], Messages>;
  }>,
  z.infer<typeof BetType>
>({
  llm: model,
  tools: [get_current_timestamp, is_bet_expired],
  prompt: prompt,
  responseFormat: BetType,
});

export const betExtracterNode = async (state: typeof agentState.State) => {
  const result = await agent.invoke(state, {
    // startTimestamp: state.startTimestamp,
    // endTimestamp: state.endTimestamp,
  });
  const isExpired = result.structuredResponse.isBetExpired;

  if (isExpired) {
    return new Command({
      update: {
        bet: result.structuredResponse,
      },
      goto: state.betCategoryType,
    });
  } else {
    return new Command({
      update: {
        bet: result.structuredResponse,
        resolution: "not_settled",
      },
      goto: END,
    });
  }
};

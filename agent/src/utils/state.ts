import {
  Annotation,
  AnnotationRoot,
  messagesStateReducer,
} from "@langchain/langgraph";
import { messageToOpenAIRole } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

export const BetType = z.object({
  prompt: z.string(),
  isBetExpired: z
    .boolean()
    .describe(
      "true if bet end time is greater than current unix timestamp false otherwise"
    ),
  startTimestamp: z
    .number()
    .describe("start time of the bet in unix timestamp"),
  endTimestamp: z.number().describe("end time of the bet in unix timestamp"),
  currentTimestap: z.number().describe("current time in unix timestamp"),
});
export const BetCategoryType = z.enum(["politics", "sports", "price"]);

export const agentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    // reducer: messagesStateReducer,
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
  startTimestamp: Annotation<number>(),
  endTimestamp: Annotation<number>(),
  prompt: Annotation<string>(),
  bet: Annotation<z.infer<typeof BetType>>(),
  betCategoryType: Annotation<z.infer<typeof BetCategoryType>>(),
  resolution: Annotation<z.infer<typeof BetResolutionResult>>(),
});

export const BetResolutionResult = z.enum(["yes", "no", "not_settled"]);

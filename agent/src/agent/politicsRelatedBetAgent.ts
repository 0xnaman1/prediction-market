import { z } from "zod";
import { model } from "../utils/model";
import { BetResolutionResult, agentState } from "../utils/state";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Command } from "@langchain/langgraph";

const politicsPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `
    You are a bet resolver i.e I give you a prompt like the examples given below.
        - Ukraine agrees to Trump mineral deal before April?
        - Yoon out as president of South Korea before April?
        - Will Putin visit the U.S. before July?
        - Will Trump acquire Greenland before July?

    you have access to the following tools:
        - TavilySearch to search the web for the latest news on the given topic.
    
    your goal is to search the web using tavily tool and find the latest news on the given topic 
    go through the content of each result and check if the event has already happend or not.

    make sure:
      - Just because someone said something will happen doesn't mean it's yes now until it actually happens or we get it officially done.

    steps to follow:
        - search the web using tavily tool and find the latest news on the given topic.
        - go through the content of each result and check if the event has already happend or not.
        - if the event has already happend return YES else return NO.
    
    Make sure to always return YES, NO for the answer.
    `,
  ],
  new MessagesPlaceholder("messages"),
]);

const politicsBetAgent = createReactAgent({
  llm: model,
  tools: [new TavilySearchResults({ maxResults: 5 })],
  stateModifier: politicsPrompt,
  responseFormat: z.object({
    resolvedAnswer: BetResolutionResult,
  }),
});

export const politicsBetNode = async (state: typeof agentState.State) => {
  const { messages } = state;
  const result = await politicsBetAgent.invoke({ messages });
  return new Command({
    update: {
      messages: [...result.messages],
      bet: {
        ...state.bet,
      },
      resolution: result.structuredResponse.resolvedAnswer,
    },
  });
};

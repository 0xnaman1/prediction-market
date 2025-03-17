import { agentState } from "./utils/state";
import { resolverNode } from "./agent/resolverAgent";
import { END, START, StateGraph } from "@langchain/langgraph";
import { cryptoPriceBetNode } from "./agent/cryptoPriceBetAgent";
import { politicsBetNode } from "./agent/politicsRelatedBetAgent";
import { betExtracterNode } from "./agent/betExtracterAgent";
import { extractorRouter } from "./router/extractorRouter";

export const subgraph = new StateGraph(agentState)
  .addNode("resolver", resolverNode)
  .addNode("extractor", betExtracterNode)
  .addNode("price", cryptoPriceBetNode)
  .addNode("politics", politicsBetNode)
  .addNode("sports", politicsBetNode)
  .addEdge(START, "resolver")
  .addEdge("resolver", "extractor")
  .addConditionalEdges("extractor", extractorRouter)
  .addEdge("politics", END)
  .addEdge("price", END)
  .addEdge("sports", END);

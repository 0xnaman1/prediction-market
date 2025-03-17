import { HumanMessage } from "@langchain/core/messages";
import { getBetInfo } from "./utils/agentWrapper";
import { resolverAgent } from "./agent/resolverAgent";
// import { visualize } from "@la";
import { subgraph } from "./graph";
import fs from "fs/promises";

async function main() {
  const msg = {
    messages: [
      new HumanMessage(
        // "starting at: 3rd March 2025: Will solana reach 200$ by 4th March 2025?"
        `what is my name?`
      ),
    ],
  };
  const representation = subgraph.compile().getGraph();
  const image = await representation.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // save to file
  // await fs.writeFile("./graph.png", buffer);

  // const streamResults =  subgraph.compile().stream(msg, {
  //   recursionLimit: 150,
  //   debug: true,
  // });
  // // Generate visualization
  // // const viz = visualize(graph);
  // for await (const output of await streamResults) {
  //   if (!output?.__end__) {
  //     // prettifyOutput(output);
  //     console.log(output);
  //     console.log("----");
  //   }
  // }
  // const state = await getBetInfo(
  //   "Ukraine agrees to Trump mineral deal before this fall?",
  //   1742137162000,
  //   1741996800000
  // );

  // const a = await resolverAgent.invoke(msg);
  // console.log(a);

  // console.log(state.bet);
}

main();

// 1. is the price of BTC greater than 50K on 15 march? - NO
// 2. would the price of BTC reach 50K by 15 march? - YES

import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

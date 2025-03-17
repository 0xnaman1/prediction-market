import { END } from "@langchain/langgraph";
import { agentState } from "../utils/state";

export const extractorRouter = async (state: typeof agentState.State) => {
  const { betCategoryType } = state;
  const { bet } = state;
  if (bet.isBetExpired) {
    return betCategoryType;
  } else {
    return END;
  }
};

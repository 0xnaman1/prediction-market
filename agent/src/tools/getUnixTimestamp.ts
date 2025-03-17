import { tool } from "@langchain/core/tools";
import { symbol, z } from "zod";
import axios from "axios";
import "dotenv/config";

function getUnixTimestamp(data: string): number {
  return new Date(data).getTime();
}

export const get_unix_timestamp = tool(
  async ({ timeString }) => {
    try {
      const timestamp = getUnixTimestamp(timeString);

      return {
        timestamp: timestamp,
      };
    } catch (e: any) {
      throw new Error(`Failed to get timestamp from ${timeString}: ${e}`);
    }
  },
  {
    name: "get_unix_timestamp",
    description: "Takes the time string and returns the unix timestamp.",
    schema: z.object({
      timeString: z
        .string()
        .describe(
          "The time string to convert to unix timestamp, it must be in format like 'september 25, 2025'"
        ),
    }),
  }
);

export const get_current_timestamp = tool(
  async () => {
    try {
      const timestamp = new Date().getTime();

      return timestamp;
    } catch (e: any) {
      throw new Error(`Failed to get current timestamp: ${e}`);
    }
  },
  {
    name: "get_current_timestamp",
    description: "gives you the current unix timestamp of the system",
    schema: z.object({}),
  }
);

export const is_bet_expired = tool(
  async ({ endTimestamp }): Promise<boolean> => {
    const currentTimestamp = new Date().getTime();
    console.log(
      `end: ${new Date(endTimestamp).getTime()} current: ${new Date(
        currentTimestamp
      ).getTime()}`
    );
    return endTimestamp < currentTimestamp;
  },
  {
    name: "is_bet_expired",
    description:
      "tells you whether the bet is expired or not based on bet's end time and current timestamp",
    schema: z.object({
      endTimestamp: z
        .number()
        .describe("end time of the bet in unix timestamp"),
    }),
  }
);

import { tool } from "@langchain/core/tools";
import { symbol, z } from "zod";
import axios from "axios";
import "dotenv/config";

export const get_ohlv_data = tool(
  async ({ symbol, interval, startTime, endTime }) => {
    try {
      const price = await getOHLVPriceData(
        symbol,
        interval,
        startTime,
        endTime
      );

      return {
        price: price,
      };
    } catch (e: any) {
      throw new Error(`Failed to get price: ${e}`);
    }
  },
  {
    name: "get_ohlv_data",
    description: "Get the OHLV data of a crypto asset.",
    schema: z.object({
      symbol: z
        .string()
        .describe("The symbol of the crypto currency, should end with USDT"),
      interval: z.enum(["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M"]),
      startTime: z
        .number()
        .describe("The start time of the bet in milliseconds unix timestamp"),
      endTime: z
        .number()
        .describe("The expiry time of the bet in milliseconds unix timestamp"),
    }),
  }
);

const a = [
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

type OHLV = (typeof a)[];

async function getOHLVPriceData(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<OHLV> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=${1500}`;
  // console.log(url);

  try {
    const response = await axios.get(url);

    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch price data for ${symbol}`);
  }
}

import { tool } from "@langchain/core/tools";
import { symbol, z } from "zod";
import axios from "axios";
import "dotenv/config";

export const get_crypto_price = tool(
  async ({ symbol }) => {
    try {
      const price = await getCryptoPrice(symbol);

      return {
        price: price,
      };
    } catch (e: any) {
      throw new Error(`Failed to get price: ${e}`);
    }
  },
  {
    name: "get_crypto_price",
    description: "Get the price of a crypto currency",
    schema: z.object({
      symbol: z.string().describe("The symbol of the crypto currency"),
    }),
  }
);

async function getCryptoPrice(symbol: string) {
  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${symbol},USD`;
  console.log(url);

  try {
    const response = await axios.get(url, {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_PRO_API_KEY,
      },
    });

    return response.data.data[symbol][0].quote.USD.price;
  } catch (e) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }
}

import dotenv from "dotenv";
import {
  getBetInfo,
  validateBet,
  validateBetRunnableSeq,
} from "./utils/agentWrapper";
import { Connection } from "@solana/web3.js";
import { PmAmm } from "./anchor-types/pm_amm";
import IDL from "./anchor-types/idl/pm_amm.json";
import {
  AnchorProvider,
  BN,
  Program,
  Provider,
  setProvider,
  Wallet,
} from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { assert } from "console";
import { PublicKey } from "@solana/web3.js";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { serve } from "@hono/node-server";

// import * as anchor from "@coral-xyz/anchor";

dotenv.config({ path: "../.env" });
const db = drizzle({
  connection: {
    connectionString: process.env.AGENT_DB_URL!,
    // ssl: true,
  },
});

const app = new Hono();

app.post(
  "/validate",
  zValidator(
    "json",
    z.object({
      prompt: z.string(),
    })
  ),
  async (c) => {
    const { prompt } = await c.req.valid("json");
    const isValid = await validateBetRunnableSeq(prompt);
    return c.json({ isValid });
  }
);

app.get("/", async (c) => {
  return c.json({ message: "hello world" });
});

export const walletInit = async () => {
  const wallet = new Wallet(
    Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY!))
    )
  );
  const connection = new Connection(process.env.RPC_URL!);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  setProvider(provider);
  const program = new Program(IDL as PmAmm, provider);
  return {
    wallet,
    connection,
    provider,
    program,
  };
};

async function main() {
  const { program, wallet } = await walletInit();

  program.addEventListener("betCreated", async (event, slot, signature) => {
    console.log(`Event: ${event}`);
    const blockTime = await program.provider.connection.getBlockTime(slot);
    await db
      .insert(schema.betsTable)
      .values({
        id: event.betId.toNumber(),
        startTimestamp: blockTime! * 1000,
        endTimestamp: event.expirationAt.toNumber() * 1000,
        prompt: event.betPrompt,
        isExpired: false,
        isResolved: false,
        creator: event.creator.toBase58(),
        resolution: "not_settled",
      })
      .onConflictDoNothing();
  });

  console.log(`starting the app on port ${3000}`);
  serve(app);

  // execute the bet settlement cron job
  console.log("starting the bet settlement cron job");
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const unresolvedBets = await db
      .select()
      .from(schema.betsTable)
      .where(eq(schema.betsTable.isResolved, false));

    for (const bet of unresolvedBets) {
      // check if the bet is expired
      if (bet.endTimestamp < Date.now()) {
        console.log(`processing bet: ${bet.id}: ${bet.prompt}`);
        // try again if the agent fail
        const betInfo = await getBetInfo(
          bet.prompt,
          bet.startTimestamp,
          bet.endTimestamp
        );
        // mark the bet as expired

        const betState = betInfo.state;

        console.log("bet state from agent: ", betState);

        let answer = 0;
        if (betState.resolution == "yes") {
          answer = 1;
        } else if (betState.resolution == "no") {
          answer = 0;
        }

        if (betState.resolution == "not_settled") {
          throw "shouldn't be not_settled";
        }
        console.log(`bet's resolution: ${betState.resolution}`);

        const [betAccountKey] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("bet"),
            new BN(bet.id).toArrayLike(Buffer, "le", 8),
            Buffer.from(new PublicKey(bet.creator).toBuffer()),
          ],
          program.programId
        );

        const [adminAccountKey] = PublicKey.findProgramAddressSync(
          [Buffer.from("admin_state")],
          program.programId
        );

        const tx = await program.methods
          .settleBet(new BN(bet.id), Number(answer))
          .accountsPartial({
            signer: wallet.publicKey,
            adminState: adminAccountKey,
            bet: betAccountKey,
          })

          .signers([wallet.payer])
          .rpc();

        console.log("bet settled transaction: ", tx);

        await db
          .update(schema.betsTable)
          .set({
            isExpired: true,
            isResolved: true,
            betCategoryType: betInfo.betCategoryType,
            resolution: betState.resolution,
            settleTx: tx,
          })
          .where(eq(schema.betsTable.id, bet.id));
      }
    }
  }
}

main().catch((e) => {
  throw e;
});

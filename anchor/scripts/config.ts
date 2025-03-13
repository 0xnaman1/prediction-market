import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import fs from "fs/promises";

const solanaWeb3 = require("@solana/web3.js");

export async function config(): Promise<Wallet> {
  const wallet = new Wallet(
    Keypair.fromSecretKey(
      Uint8Array.from(
        JSON.parse(
          (await fs.readFile("/Users/naman/.config/solana/id.json")).toString()
        )
      )
    )
  );

  return wallet;
}

export const connection = new Connection("https://api.testnet.sonic.game");
export const PROGRAM_ID = new PublicKey(
  "CNqGv5P92gnmnFEHqk2csdw1v8by2U5Q1CVwZZbBnguE"
);

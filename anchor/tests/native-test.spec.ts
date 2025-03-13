import * as anchor from "@coral-xyz/anchor";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import { PmAmm } from "../target/types/pm_amm";
import { Connection, PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import fs from "fs/promises";

import {
  AnchorProvider,
  setProvider,
  Wallet,
  Program,
  BN,
  Provider,
} from "@coral-xyz/anchor";

import IDL from "../target/idl/pm_amm.json";

describe("PmAm", () => {
  const coder = new BorshCoder(IDL as PmAmm);
  let admin: Keypair;
  let adminAccountKey: PublicKey;
  let adminAccount;
  let program: Program<PmAmm>;
  let connection: Connection;

  beforeAll(async () => {
    const wallet = new Wallet(
      Keypair.fromSecretKey(
        Uint8Array.from(
          JSON.parse(
            (
              await fs.readFile("/Users/naman/.config/solana/id.json")
            ).toString()
          )
        )
      )
    );

    admin = wallet.payer as Keypair;
    connection = new Connection("http://127.0.0.1:8899");
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "finalized",
    });
    anchor.setProvider(provider);

    program = anchor.workspace.PmAmm as Program<PmAmm>;

    [adminAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin_state")],
      program.programId
    );
  });

  it("is initialized", async () => {
    const listener = program.addEventListener(
      "adminStateInitialized",
      async (event, slot, signature) => {
        console.log("event data", event);
        console.log("slot", slot);
        console.log("signature", signature);

        const txResponse = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });

        const logs = txResponse?.meta?.logMessages || [];

        console.log("logs", logs);
        const eventParser = new EventParser(program.programId, coder);

        const logs0 = Array.from(eventParser.parseLogs(logs)); // Convert generator to array

        for (const log of logs0) {
          console.log("Parsed log:", log);
        }
      }
    );
    await program.methods
      .initialize()
      .accounts({
        signer: admin.publicKey,
      })
      .rpc({ commitment: "confirmed" });
    adminAccount = await program.account.admin.fetch(
      adminAccountKey,
      "confirmed"
    );
  });
});

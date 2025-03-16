import { config, connection, PROGRAM_ID } from "./config";
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program, BN } from "@coral-xyz/anchor";
const solanaWeb3 = require("@solana/web3.js");

import IDL from "../target/idl/pm_amm.json";
import { PmAmm } from "@project/anchor";
import { QrCode } from "lucide-react";

async function resolve_bet() {
  const wallet = await config();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  setProvider(provider);

  const program = new Program<PmAmm>(IDL as PmAmm, provider);

  const admin = wallet.payer as Keypair;

  const [adminAccountKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("admin_state")],
    program.programId
  );

  const creatorPublicKey = new PublicKey(
    "EfvpVLkPGr8g7wrymwYyS5aHCqRupuhRjf8vsmVNtjHa"
  );

  const [betAccountKey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bet"),
      new BN(1742135483).toArrayLike(Buffer, "le", 8),
      Buffer.from(creatorPublicKey.toBuffer()),
    ],
    program.programId
  );

  // console.log(program.programId.toBase58());
  // console.log(adminAccountKey.toBase58());
  console.log(betAccountKey.toBase58());

  // const tx = await program.methods
  //   .settleBet(new BN(1), 0)
  //   .accountsPartial({
  //     signer: admin.publicKey,
  //     adminState: adminAccountKey,
  //     bet: betAccountKey,
  //   })
  //   .rpc({ commitment: "confirmed" });

  const betAccount = await program.account.bet.fetch(
    betAccountKey,
    "confirmed"
  );

  console.log("bet account expiration", betAccount);
}

resolve_bet();

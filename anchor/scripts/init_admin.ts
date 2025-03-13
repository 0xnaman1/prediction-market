import { config, connection, PROGRAM_ID } from "./config";
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
const solanaWeb3 = require("@solana/web3.js");

import IDL from "../target/idl/pm_amm.json";
import { PmAmm } from "@project/anchor";

async function init_admin() {
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

  const tx = await program.methods
    .initialize()
    .accounts({
      signer: admin.publicKey,
    })
    .rpc({ commitment: "confirmed" });

  const adminAccount = await program.account.admin.fetch(
    adminAccountKey,
    "confirmed"
  );

  console.log("tx", tx);

  console.log("admin account", adminAccount);
}

init_admin();

// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import PmAmmIDL from "../target/idl/pm_amm.json";
import type { PmAmm } from "../target/types/pm_amm";

// Re-export the generated IDL and type
export { PmAmm, PmAmmIDL };

// The programId is imported from the program IDL.
export const PM_AMM_PROGRAM_ID = new PublicKey(PmAmmIDL.address);

// This is a helper function to get the PmAmm Anchor program.
export function getPmAmmProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program(
    {
      ...PmAmmIDL,
      address: address ? address.toBase58() : PmAmmIDL.address,
    } as PmAmm,
    provider
  );
}

// This is a helper function to get the program ID for the PmAmm program depending on the cluster.
export function getPmAmmProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the PmAmm program on devnet and testnet.
      return new PublicKey("CNqGv5P92gnmnFEHqk2csdw1v8by2U5Q1CVwZZbBnguE");
    case "mainnet-beta":
    default:
      return PM_AMM_PROGRAM_ID;
  }
}

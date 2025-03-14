"use client";

import { getPmAmmProgram, getPmAmmProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";

interface CreateBetArgs {
  betId: number;
  initialLiq: number;
  betPrompt: string;
  expirationAt: number;
}

interface InitBetArgs {
  betId: number;
}

export function usePmAmmProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getPmAmmProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getPmAmmProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["bet", "all", { cluster }],
    queryFn: () => program.account.bet.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createBet = useMutation<string, Error, CreateBetArgs>({
    mutationKey: ["bet", "createBet", { cluster }],
    mutationFn: ({ betId, initialLiq, betPrompt, expirationAt }) =>
      program.methods
        .createBetAccount(
          new BN(betId),
          new BN(initialLiq),
          betPrompt,
          new BN(expirationAt)
        )
        .accounts({ tokenProgram: TOKEN_PROGRAM_ID })
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create bet"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createBet,
  };
}

export function usePmAmmProgramAccount({ account }: { account: PublicKey }) {
  const provider = useAnchorProvider();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program } = usePmAmmProgram();

  const accountQuery = useQuery({
    queryKey: ["bet", "fetch", { cluster, account }],
    queryFn: () => program.account.bet.fetch(account),
  });

  const getYesPrice = useQuery({
    queryKey: ["bet", "getYesPrice", { cluster, account }],
    queryFn: async () => {
      const simulation = await program.methods
        .getPrice(0)
        .accounts({ bet: account })
        .simulate();

      const returnLogEntry = simulation.raw.find((log) =>
        log.startsWith("Program return: ")
      );
      const encodedData = returnLogEntry?.split(" ")[3];

      const decodedData = Buffer.from(encodedData ?? "", "base64");
      const returnValue = new BN(decodedData, "le");
      console.log("returnValue", returnValue.toString());
      return returnValue.toString();
    },
    enabled: !!accountQuery.data?.isInitialized,
  });

  const getNoPrice = useQuery({
    queryKey: ["bet", "getNoPrice", { cluster, account }],
    queryFn: async () => {
      const simulation = await program.methods
        .getPrice(1)
        .accounts({ bet: account })
        .simulate();

      const returnLogEntry = simulation.raw.find((log) =>
        log.startsWith("Program return: ")
      );
      const encodedData = returnLogEntry?.split(" ")[3];

      const decodedData = Buffer.from(encodedData ?? "", "base64");
      const returnValue = new BN(decodedData, "le");
      console.log("returnValue", returnValue.toString());
      return returnValue.toString();
    },
    enabled: !!accountQuery.data?.isInitialized,
  });

  const initBet = useMutation({
    mutationKey: ["bet", "init", { cluster }],
    mutationFn: async ({ betId }: { betId: number }) => {
      const [mintYesKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_yes"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(provider.wallet.publicKey.toBuffer()),
        ],
        program.programId
      );

      const [mintNoKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_no"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(provider.wallet.publicKey.toBuffer()),
        ],
        program.programId
      );

      const [betAccountKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bet"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(provider.wallet.publicKey.toBuffer()),
        ],
        program.programId
      );

      return program.methods
        .initBetAccount(new BN(betId))
        .accountsPartial({
          bet: betAccountKey,
          mintYes: mintYesKey,
          mintNo: mintNoKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accountQuery.refetch();
    },
    onError: () => toast.error("Failed to initialize bet"),
  });

  const buyYes = useMutation({
    mutationKey: ["bet", "buyYes", { cluster }],
    mutationFn: async ({
      betId,
      outcome,
      amount,
    }: {
      betId: number;
      outcome: number;
      amount: number;
    }) => {
      const betAccount = await program.account.bet.fetch(account);
      const creator = betAccount.creator;
      // Get the bet account first to find the creator
      const [betAccountKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bet"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(creator.toBuffer()),
        ],
        program.programId
      );

      const [mintYesKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_yes"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(creator.toBuffer()),
        ],
        program.programId
      );
      const [mintNoKey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("mint_no"),
          new BN(betId).toArrayLike(Buffer, "le", 8),
          Buffer.from(creator.toBuffer()),
        ],
        program.programId
      );

      return program.methods
        .buy(new BN(betId), outcome, new BN(amount))
        .accountsPartial({
          bet: betAccountKey,
          mintYes: mintYesKey,
          mintNo: mintNoKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accountQuery.refetch();
    },
    onError: () => toast.error("Failed to buy yes shares"),
  });

  return {
    accountQuery,
    initBet,
    buyYes,
    getYesPrice,
    getNoPrice,
  };
}

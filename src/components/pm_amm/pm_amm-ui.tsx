"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { usePmAmmProgram, usePmAmmProgramAccount } from "./pm_amm-data-access";
import { useWallet } from "@solana/wallet-adapter-react";

export function PmAmmCreate() {
  const { createBet } = usePmAmmProgram();
  const [betId, setBetId] = useState(0);
  const [betPrompt, setBetPrompt] = useState("");
  const [expirationAt, setExpirationAt] = useState(0);
  const [initialLiq, setInitialLiq] = useState(0);
  const { publicKey } = useWallet();

  const ifFormValid =
    betPrompt.length > 0 && expirationAt > 0 && initialLiq > 0;

  const handleSubmit = () => {
    if (publicKey && ifFormValid) {
      createBet.mutateAsync({
        betId,
        betPrompt,
        expirationAt,
        initialLiq,
      });
    }
  };

  if (!publicKey) {
    return <p>Connect your wallet</p>;
  }

  return (
    <div>
      <input
        name="betId"
        type="text"
        placeholder="Bet Id"
        value={betId}
        onChange={(e) => setBetId(parseInt(e.target.value))}
        className="input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Prompt"
        value={betPrompt}
        onChange={(e) => setBetPrompt(e.target.value)}
        className="input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Expiration"
        value={expirationAt}
        onChange={(e) => setExpirationAt(parseInt(e.target.value))}
        className="input input-bordered w-full max-w-xs"
      />{" "}
      <input
        type="text"
        placeholder="Liquidity"
        value={initialLiq}
        onChange={(e) => setInitialLiq(parseInt(e.target.value))}
        className="input input-bordered w-full max-w-xs"
      />{" "}
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleSubmit}
        disabled={createBet.isPending || !ifFormValid}
      >
        Create new bet account {createBet.isPending && "..."}
      </button>
    </div>
  );
}

export function PmAmmList() {
  const { accounts, getProgramAccount } = usePmAmmProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <PmAmmCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function PmAmmCard({ account }: { account: PublicKey }) {
  const [amount, setAmount] = useState(0);
  const { accountQuery, initBet, buyYes } = usePmAmmProgramAccount({
    account,
  });

  const betId = useMemo(
    () => accountQuery.data?.betId ?? 0,
    [accountQuery.data?.betId]
  );

  const betPrompt = useMemo(
    () => accountQuery.data?.betPrompt ?? "",
    [accountQuery.data?.betPrompt]
  );

  let expiration = useMemo(
    () => accountQuery.data?.expirationAt ?? 0,
    [accountQuery.data?.expirationAt]
  );

  const isInitialized = useMemo(
    () => accountQuery.data?.isInitialized ?? false,
    [accountQuery.data?.isInitialized]
  );

  const handleInitialize = () => {
    initBet.mutateAsync({ betId: Number(betId) });
  };

  const handleBuy = () => {
    buyYes.mutateAsync({ betId: Number(betId), outcome: 0, amount });
  };

  const handleSell = () => {
    // Add your sell logic here
    // console.log("Selling shares:", amount);
  };

  expiration = parseInt(expiration.toString());

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            Bet Id : {betId.toString()}
          </h2>
          <p className="text-lg">Prompt: {betPrompt}</p>
          <p>Expires at: {new Date(expiration * 1000).toLocaleString()}</p>

          {!isInitialized ? (
            <button
              className="btn btn-primary"
              onClick={handleInitialize}
              disabled={initBet.isPending}
            >
              Initialize Bet {initBet.isPending && "..."}
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="input input-bordered w-full max-w-xs"
              />
              <div className="flex gap-4 justify-center">
                <button
                  className="btn btn-success"
                  onClick={handleBuy}
                  disabled={amount <= 0}
                >
                  Buy Yes
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleSell}
                  disabled={amount <= 0}
                >
                  Buy No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

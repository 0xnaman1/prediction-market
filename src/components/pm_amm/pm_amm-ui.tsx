"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo, useState, useEffect } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { usePmAmmProgram, usePmAmmProgramAccount } from "./pm_amm-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { BN } from "@coral-xyz/anchor";

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
    return (
      <div className="text-gray-400 text-center">
        Connect your wallet to continue
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto bg-[#1C2127] border-[#2D3139]">
      <CardHeader>
        <CardTitle className="text-white">Create New Market</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          name="betId"
          type="text"
          placeholder="Market ID"
          value={betId}
          onChange={(e) => setBetId(parseInt(e.target.value))}
          className="bg-[#232830] border-[#2D3139] text-white"
        />
        <Input
          type="text"
          placeholder="What's your prediction?"
          value={betPrompt}
          onChange={(e) => setBetPrompt(e.target.value)}
          className="bg-[#232830] border-[#2D3139] text-white"
        />
        <Input
          type="text"
          placeholder="Expiration Time"
          value={expirationAt}
          onChange={(e) => setExpirationAt(parseInt(e.target.value))}
          className="bg-[#232830] border-[#2D3139] text-white"
        />
        <Input
          type="text"
          placeholder="Initial Liquidity"
          value={initialLiq}
          onChange={(e) => setInitialLiq(parseInt(e.target.value))}
          className="bg-[#232830] border-[#2D3139] text-white"
        />
        <Button
          className="w-full bg-[#6E56CF] hover:bg-[#7C6AD9] text-white"
          onClick={handleSubmit}
          disabled={createBet.isPending || !ifFormValid}
        >
          {createBet.isPending ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Creating Market...</span>
            </div>
          ) : (
            "Create Prediction Market"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PmAmmList() {
  const { accounts, getProgramAccount } = usePmAmmProgram();

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" />
      </div>
    );
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="bg-[#1C2127] border border-[#2D3139] rounded-lg p-4 text-center text-gray-400">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-6 py-8">
      {accounts.isLoading ? (
        <div className="flex items-center justify-center h-48">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" />
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {accounts.data?.map((account) => (
            <PmAmmCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <h2 className="text-2xl font-medium mb-4">No Markets Yet</h2>
          <p>Create your first prediction market to get started.</p>
        </div>
      )}
    </div>
  );
}

function PmAmmCard({ account }: { account: PublicKey }) {
  const [amount, setAmount] = useState(0);
  const {
    accountQuery,
    initBet,
    buy,
    getYesPrice,
    getNoPrice,
    claim,
    program,
  } = usePmAmmProgramAccount({
    account,
  });

  const betId = useMemo(
    () => accountQuery.data?.betId ?? 0,
    [accountQuery.data?.betId]
  );

  const creator = useMemo(
    () => accountQuery.data?.creator.toString() ?? "",
    [accountQuery.data?.creator]
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

  const isExpired = useMemo(() => {
    const now = Date.now();
    const expiration = accountQuery.data?.expirationAt ?? 0;
    if (now > parseInt(expiration.toString()) * 1000) return true;
    return false;
  }, [accountQuery.data?.expirationAt]);

  const yesPrice = useMemo(() => {
    if (!getYesPrice.data) return null;
    return (Number(getYesPrice.data) / 1_000_000_000).toFixed(2);
  }, [getYesPrice.data]);

  const noPrice = useMemo(() => {
    if (!getNoPrice.data) return null;
    return (Number(getNoPrice.data) / 1_000_000_000).toFixed(2);
  }, [getNoPrice.data]);

  const handleInitialize = () => {
    initBet.mutateAsync({ betId: Number(betId) });
  };

  const handleBuyYes = () => {
    buy.mutateAsync({ betId: Number(betId), outcome: 0, amount });
  };

  const handleBuyNo = () => {
    console.log("Buying no");
    buy.mutateAsync({ betId: Number(betId), outcome: 1, amount });
  };

  const handleClaim = () => {
    // TODO: Implement claim functionality
    console.log("Claiming prize for bet", betId);
    claim.mutate;
  };

  expiration = parseInt(expiration.toString());

  return accountQuery.isLoading ? (
    <div className="flex items-center justify-center h-48">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" />
    </div>
  ) : (
    <Card className="bg-[#1C2127] border-[#2D3139] text-white h-full flex flex-col">
      <CardHeader className="pb-4 space-y-2">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl font-medium bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">
            #{betId.toString()}
          </CardTitle>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Expires {new Date(expiration * 1000).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        <p className="text-lg text-gray-200">{betPrompt}</p>

        {!isInitialized ? (
          <div>
            <Button
              className="w-full bg-[#6E56CF] hover:bg-[#7C6AD9] mt-auto"
              onClick={handleInitialize}
              disabled={initBet.isPending}
            >
              {initBet.isPending ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Initializing...</span>
                </div>
              ) : (
                "Initialize Market"
              )}
            </Button>
            <div className="flex justify-between items-center"></div>
            <span className="text-sm text-gray-400">Creator: {creator}</span>
          </div>
        ) : isExpired ? (
          <div className="space-y-6">
            <div className="text-center text-yellow-400 mb-4">
              This market has expired
            </div>
            <Button
              className="w-full bg-[#6E56CF] hover:bg-[#7C6AD9] text-white font-medium py-5"
              onClick={handleClaim}
            >
              Claim Prize
            </Button>
            <span className="text-sm text-gray-400">Creator: {creator}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="bg-[#232830] border-[#2D3139] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="bg-[#2B9F6A] hover:bg-[#238B59] text-white font-medium py-5"
                onClick={handleBuyYes}
                disabled={amount <= 0}
              >
                <div className="flex flex-col items-center">
                  <span>Buy Yes</span>
                  {yesPrice && (
                    <span className="text-sm opacity-80">
                      Price: {yesPrice} SOL
                    </span>
                  )}
                </div>
              </Button>
              <Button
                className="bg-[#E54D2E] hover:bg-[#CA4425] text-white font-medium py-5"
                onClick={handleBuyNo}
                disabled={amount <= 0}
              >
                <div className="flex flex-col items-center">
                  <span>Buy No</span>
                  {noPrice && (
                    <span className="text-sm opacity-80">
                      Price: {noPrice} SOL
                    </span>
                  )}
                </div>
              </Button>
              <span className="text-sm text-gray-400">Creator: {creator}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { usePmAmmProgram } from "./pm_amm-data-access";
import { PmAmmCreate, PmAmmList } from "./pm_amm-ui";

export default function PmAmmFeature() {
  const { publicKey } = useWallet();
  const { programId } = usePmAmmProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="Market creation"
        subtitle={"Create a new bet account here."}
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <PmAmmCreate />
      </AppHero>
      <PmAmmList />
      <div className="mb-6" />
    </div>
  ) : (
    <div className="w-full flex-grow">
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-blue-900/30" />
        <div className="absolute inset-0 bg-[url('/b.png')] opacity-30 bg-cover bg-center bg-no-repeat" />

        {/* Main content */}
        <div className="relative z-10 text-center space-y-8 px-4 w-full max-w-7xl mx-auto py-16">
          <h1 className="text-7xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text">
            Predict. Trade. Earn.
          </h1>
          <h2 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-orange-300 via-pink-400 to-purple-400 text-transparent bg-clip-text mb-8">
            Source of Truth for All
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 font-bold">
            Create and Bet on outcomes resolved by AI agents on sonic chain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <WalletButton className="px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/25" />
            {/* <a
              href="https://solana.com/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 text-lg font-medium rounded-xl bg-[#1C2127] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
            >
              Learn More
            </a> */}
          </div>

          {/* Quick Links */}
          {/* <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <a
              href="https://docs.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-[#1C2127]/50 hover:bg-[#1C2127] transition-colors border border-purple-500/10 hover:border-purple-500/20"
            >
              <p className="text-gray-300 hover:text-purple-400 text-lg">
                Solana Docs
              </p>
            </a>
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-[#1C2127]/50 hover:bg-[#1C2127] transition-colors border border-purple-500/10 hover:border-purple-500/20"
            >
              <p className="text-gray-300 hover:text-purple-400 text-lg">
                Solana Faucet
              </p>
            </a>
            <a
              href="https://solana.com/cookbook"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-[#1C2127]/50 hover:bg-[#1C2127] transition-colors border border-purple-500/10 hover:border-purple-500/20"
            >
              <p className="text-gray-300 hover:text-purple-400 text-lg">
                Cookbook
              </p>
            </a>
            <a
              href="https://github.com/solana-developers"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-xl bg-[#1C2127]/50 hover:bg-[#1C2127] transition-colors border border-purple-500/10 hover:border-purple-500/20"
            >
              <p className="text-gray-300 hover:text-purple-400 text-lg">
                GitHub
              </p>
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
}

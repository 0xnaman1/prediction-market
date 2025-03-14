"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppModal, ellipsify } from "../ui/ui-layout";
import { useCluster } from "../cluster/cluster-data-access";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from "./account-data-access";

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address });

  return (
    <div>
      <h1
        className="text-5xl font-bold cursor-pointer"
        onClick={() => query.refetch()}
      >
        {query.data ? <BalanceSol balance={query.data} /> : "..."} SOL
      </h1>
    </div>
  );
}
export function AccountChecker() {
  const { publicKey } = useWallet();
  if (!publicKey) {
    return null;
  }
  return <AccountBalanceCheck address={publicKey} />;
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster();
  const mutation = useRequestAirdrop({ address });
  const query = useGetBalance({ address });

  if (query.isLoading) {
    return null;
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 rounded-none flex justify-center">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account
          is not found on this cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() =>
            mutation.mutateAsync(1).catch((err) => console.log(err))
          }
        >
          Request Airdrop
        </button>
      </div>
    );
  }
  return null;
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet();
  const { cluster } = useCluster();
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <div>
      <ModalAirdrop
        hide={() => setShowAirdropModal(false)}
        address={address}
        show={showAirdropModal}
      />
      <ModalReceive
        address={address}
        show={showReceiveModal}
        hide={() => setShowReceiveModal(false)}
      />
      <ModalSend
        address={address}
        show={showSendModal}
        hide={() => setShowSendModal(false)}
      />
      <div className="space-x-2">
        <button
          disabled={cluster.network?.includes("mainnet")}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </button>
        <button
          disabled={wallet.publicKey?.toString() !== address.toString()}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowSendModal(true)}
        >
          Send
        </button>
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowReceiveModal(true)}
        >
          Receive
        </button>
      </div>
    </div>
  );
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-4">
      <div className="justify-between">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text">
            Token Accounts
          </h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" />
            ) : (
              <button
                className="px-3 py-2 rounded-lg bg-[#1C2127] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ["getTokenAccountBalance"],
                  });
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div className="rounded-xl overflow-hidden border border-[#2D3139] bg-[#1C2127]/50">
          {query.data.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No token accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1C2127]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                      Public Key
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                      Mint
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3139]">
                  {items?.map(({ account, pubkey }) => (
                    <tr
                      key={pubkey.toString()}
                      className="hover:bg-[#1C2127]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink
                              label={ellipsify(pubkey.toString())}
                              path={`account/${pubkey.toString()}`}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="font-mono">
                            <ExplorerLink
                              label={ellipsify(account.data.parsed.info.mint)}
                              path={`account/${account.data.parsed.info.mint.toString()}`}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono">
                          {account.data.parsed.info.tokenAmount.uiAmount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(query.data?.length ?? 0) > 5 && (
                <div className="px-6 py-4 text-center border-t border-[#2D3139]">
                  <button
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1C2127] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? "Show Less" : "Show All"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address });
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 text-transparent bg-clip-text">
          Transaction History
        </h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" />
          ) : (
            <button
              className="px-3 py-2 rounded-lg bg-[#1C2127] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
              onClick={() => query.refetch()}
            >
              <IconRefresh size={16} />
            </button>
          )}
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div className="rounded-xl overflow-hidden border border-[#2D3139] bg-[#1C2127]/50">
          {query.data.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1C2127]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                      Signature
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                      Slot
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                      Block Time
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3139]">
                  {items?.map((item) => (
                    <tr
                      key={item.signature}
                      className="hover:bg-[#1C2127]/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono">
                        <ExplorerLink
                          path={`tx/${item.signature}`}
                          label={ellipsify(item.signature, 8)}
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-right">
                        <ExplorerLink
                          path={`block/${item.slot}`}
                          label={item.slot.toString()}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {new Date((item.blockTime ?? 0) * 1000).toISOString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.err ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100/10 text-red-400">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/10 text-green-400">
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(query.data?.length ?? 0) > 5 && (
                <div className="px-6 py-4 text-center border-t border-[#2D3139]">
                  <button
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1C2127] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? "Show Less" : "Show All"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BalanceSol({ balance }: { balance: number }) {
  return (
    <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
  );
}

function ModalReceive({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  return (
    <AppModal title="Receive" hide={hide} show={show}>
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  );
}

function ModalAirdrop({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const mutation = useRequestAirdrop({ address });
  const [amount, setAmount] = useState("2");

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}

function ModalSend({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const wallet = useWallet();
  const mutation = useTransferSol({ address });
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide());
      }}
    >
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="Destination"
        className="input input-bordered w-full"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}

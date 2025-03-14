"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { AppModal } from "../ui/ui-layout";
import { ClusterNetwork, useCluster } from "./cluster-data-access";
import { Connection } from "@solana/web3.js";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";

export function ExplorerLink({
  path,
  label,
  className,
}: {
  path: string;
  label: string;
  className?: string;
}) {
  const { getExplorerUrl } = useCluster();
  return (
    <a
      href={getExplorerUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ? className : `text-[#6E56CF] hover:underline font-mono`
      }
    >
      {label}
    </a>
  );
}

export function ClusterChecker({ children }: { children: ReactNode }) {
  const { cluster } = useCluster();
  const { connection } = useConnection();

  const query = useQuery({
    queryKey: ["version", { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  });
  if (query.isLoading) {
    return null;
  }
  if (query.isError || !query.data) {
    return (
      <div className="bg-[#1C2127] border-b border-[#2D3139] py-2 px-4 text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <span>
            Error connecting to cluster <strong>{cluster.name}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-[#2D3139] text-[#6E56CF] hover:bg-[#2D3139]"
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  return children;
}

export function ClusterUiSelect() {
  const { clusters, setCluster, cluster } = useCluster();
  return (
    <Select
      value={cluster.name}
      onValueChange={(value) =>
        setCluster(clusters.find((c) => c.name === value)!)
      }
    >
      <SelectTrigger className="w-[180px] bg-[#232830] border-[#2D3139] text-white">
        <SelectValue placeholder="Select cluster" />
      </SelectTrigger>
      <SelectContent className="bg-[#1C2127] border-[#2D3139]">
        {clusters.map((item) => (
          <SelectItem
            key={item.name}
            value={item.name}
            className={`${
              item.active ? "bg-[#2D3139] text-[#6E56CF]" : "text-white"
            } hover:bg-[#2D3139] hover:text-[#6E56CF]`}
          >
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ClusterUiModal({
  hideModal,
  show,
}: {
  hideModal: () => void;
  show: boolean;
}) {
  const { addCluster } = useCluster();
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<ClusterNetwork | undefined>();
  const [endpoint, setEndpoint] = useState("");

  return (
    <AppModal
      title={"Add Cluster"}
      hide={hideModal}
      show={show}
      submit={() => {
        try {
          new Connection(endpoint);
          if (name) {
            addCluster({ name, network, endpoint });
            hideModal();
          }
        } catch {
          console.log("Invalid cluster endpoint");
        }
      }}
      submitLabel="Save"
    >
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Name"
          className="bg-[#232830] border-[#2D3139] text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Endpoint"
          className="bg-[#232830] border-[#2D3139] text-white"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
        <Select
          value={network}
          onValueChange={(value) => setNetwork(value as ClusterNetwork)}
        >
          <SelectTrigger className="w-full bg-[#232830] border-[#2D3139] text-white">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent className="bg-[#1C2127] border-[#2D3139]">
            <SelectItem
              value={ClusterNetwork.Devnet}
              className="text-white hover:bg-[#2D3139] hover:text-[#6E56CF]"
            >
              Devnet
            </SelectItem>
            <SelectItem
              value={ClusterNetwork.Testnet}
              className="text-white hover:bg-[#2D3139] hover:text-[#6E56CF]"
            >
              Testnet
            </SelectItem>
            <SelectItem
              value={ClusterNetwork.Mainnet}
              className="text-white hover:bg-[#2D3139] hover:text-[#6E56CF]"
            >
              Mainnet
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </AppModal>
  );
}

export function ClusterUiTable() {
  const { clusters, setCluster, deleteCluster } = useCluster();
  return (
    <div className="space-y-4 w-full flex justify-center">
      {clusters.map((item) => (
        <Card
          key={item.name}
          className={`bg-[#1C2127] border-[#2D3139] ${
            item?.active ? "ring-1 ring-[#6E56CF]" : ""
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white">
                    {item?.active ? (
                      item.name
                    ) : (
                      <button
                        className="hover:text-[#6E56CF] transition-colors"
                        onClick={() => setCluster(item)}
                      >
                        {item.name}
                      </button>
                    )}
                  </h3>
                  <span className="text-xs text-gray-400">
                    Network: {item.network ?? "custom"}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{item.endpoint}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border-[#2D3139] text-gray-400 hover:text-[#E54D2E] hover:border-[#E54D2E]"
                disabled={item?.active}
                onClick={() => {
                  if (!window.confirm("Are you sure?")) return;
                  deleteCluster(item);
                }}
              >
                <IconTrash size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

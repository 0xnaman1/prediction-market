'use client'

import { getPmAmmProgram, getPmAmmProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function usePmAmmProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getPmAmmProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getPmAmmProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['pm_amm', 'all', { cluster }],
    queryFn: () => program.account.pm_amm.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['pm_amm', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ pm_amm: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function usePmAmmProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = usePmAmmProgram()

  const accountQuery = useQuery({
    queryKey: ['pm_amm', 'fetch', { cluster, account }],
    queryFn: () => program.account.pm_amm.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['pm_amm', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ pm_amm: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['pm_amm', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ pm_amm: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['pm_amm', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ pm_amm: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['pm_amm', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ pm_amm: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}

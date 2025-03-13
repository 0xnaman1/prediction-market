import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { PmAmm } from '../target/types/pm_amm'

describe('pm_amm', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.PmAmm as Program<PmAmm>

  const pm_ammKeypair = Keypair.generate()

  it('Initialize PmAmm', async () => {
    await program.methods
      .initialize()
      .accounts({
        pm_amm: pm_ammKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([pm_ammKeypair])
      .rpc()

    const currentCount = await program.account.pm_amm.fetch(pm_ammKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment PmAmm', async () => {
    await program.methods.increment().accounts({ pm_amm: pm_ammKeypair.publicKey }).rpc()

    const currentCount = await program.account.pm_amm.fetch(pm_ammKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment PmAmm Again', async () => {
    await program.methods.increment().accounts({ pm_amm: pm_ammKeypair.publicKey }).rpc()

    const currentCount = await program.account.pm_amm.fetch(pm_ammKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement PmAmm', async () => {
    await program.methods.decrement().accounts({ pm_amm: pm_ammKeypair.publicKey }).rpc()

    const currentCount = await program.account.pm_amm.fetch(pm_ammKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set pm_amm value', async () => {
    await program.methods.set(42).accounts({ pm_amm: pm_ammKeypair.publicKey }).rpc()

    const currentCount = await program.account.pm_amm.fetch(pm_ammKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the pm_amm account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        pm_amm: pm_ammKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.pm_amm.fetchNullable(pm_ammKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})

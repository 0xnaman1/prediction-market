import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { PmAmm } from "../target/types/pm_amm";

import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { start, BanksClient, Clock, ProgramTestContext } from "solana-bankrun";
import { PublicKey, Connection } from "@solana/web3.js";
import IDL from "../target/idl/pm_amm.json";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("pm_amm", () => {
  let admin: Keypair;
  let user: Keypair;
  let participant0: Keypair;
  let participant1: Keypair;

  let context: ProgramTestContext;

  let provider: BankrunProvider;

  let program: Program<PmAmm>;

  let banksClient: BanksClient;

  let adminAccountKey: PublicKey;
  let betAccountKey: PublicKey;
  let adminAccount;
  let betAccount;
  let mintYesKey: PublicKey;
  let mintNoKey: PublicKey;

  user = Keypair.generate();
  participant0 = Keypair.generate();
  participant1 = Keypair.generate();

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "pm_amm", programId: new PublicKey(IDL.address) }],
      [
        {
          address: user.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
        {
          address: participant0.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
        {
          address: participant1.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
      ]
    );

    provider = new BankrunProvider(context);
    anchor.setProvider(provider);
    program = new Program<PmAmm>(IDL as PmAmm, provider);
    banksClient = context.banksClient;
    admin = provider.wallet.payer;

    [adminAccountKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("admin_state")],
      program.programId
    );
  });

  it("should init an admin account", async () => {
    await program.methods
      .initialize()
      .accounts({
        signer: admin.publicKey,
      })
      .rpc({ commitment: "confirmed" });
    adminAccount = await program.account.admin.fetch(
      adminAccountKey,
      "confirmed"
    );

    expect(adminAccount.isInitialized).toBe(true);
    expect(adminAccount.admin.equals(admin.publicKey)).toBe(true);
  });

  it("should create and init a bet", async () => {
    await program.methods
      .createBetAccount(
        new anchor.BN(1),
        new anchor.BN(100001),
        "Will the price of SOL increase in the next 24 hours?",
        new anchor.BN(1743771394)
      )
      .accounts({
        signer: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc({ commitment: "confirmed" });

    [betAccountKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");

    console.log("shares[0]", betAccount.shares[0].toNumber());
    console.log("shares[1]", betAccount.shares[1].toNumber());

    console.log("betAccount=", betAccount);

    expect(betAccount.isInitialized).toBe(false);
    expect(betAccount.expirationAt.toNumber()).toBe(
      new anchor.BN(1743771394).toNumber()
    );

    console.log("total_liq", betAccount.totalLiq.toNumber());
    console.log("constant", betAccount.constant.toNumber());

    [mintYesKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_yes"),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    const mintYesAccount = await getMint(provider.connection, mintYesKey);

    [mintNoKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_no"),
        new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    const mintNoAccount = await getMint(provider.connection, mintNoKey);

    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");
    const initialBalance = await banksClient.getBalance(betAccountKey);

    await program.methods
      .initBetAccount(new anchor.BN(1))
      .accountsPartial({
        signer: user.publicKey,
        bet: betAccountKey,
        mintYes: mintYesAccount.address,
        mintNo: mintNoAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc({ commitment: "confirmed" });

    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");
    expect(betAccount.isInitialized).toBe(true);
    expect(betAccount.betId.toNumber()).toBe(1);

    const finalBalance = await banksClient.getBalance(betAccountKey);
    expect(finalBalance).toBe(initialBalance + BigInt(100001));

    const destinationYesKey = await getAssociatedTokenAddress(
      mintYesKey,
      user.publicKey
    );

    const destinationYesAccount = await getAccount(
      provider.connection,
      destinationYesKey
    );

    const destinationNoKey = await getAssociatedTokenAddress(
      mintNoKey,
      user.publicKey
    );

    const destinationNoAccount = await getAccount(
      provider.connection,
      destinationNoKey
    );

    console.log("destinationYesAccount=", destinationYesAccount.amount);
    console.log("destinationNoAccount=", destinationNoAccount.amount);
  });

  it("should buy shares of a bet", async () => {
    // Get the bet account
    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");

    // Check initial shares
    const initialYesShares = betAccount.shares[0].toNumber();
    const initialNoShares = betAccount.shares[1].toNumber();

    console.log("initialYesShares", initialYesShares);
    console.log("initialNoShares", initialNoShares);

    const initialBalance = await banksClient.getBalance(betAccountKey);
    console.log("initialBalance before buy", initialBalance);

    await program.methods
      .buy(new anchor.BN(1), 0, new anchor.BN(1000))
      .accountsPartial({
        signer: participant0.publicKey,
        bet: betAccountKey,
        mintYes: mintYesKey,
        mintNo: mintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([participant0])
      .rpc({ commitment: "confirmed" });

    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");
    // Check final shares
    const finalYesShares = betAccount.shares[0].toNumber();
    const finalNoShares = betAccount.shares[1].toNumber();

    console.log("finalYesShares", finalYesShares);
    console.log("finalNoShares", finalNoShares);

    // Check yes shares have increased
    expect(finalYesShares).toBe(initialYesShares + 1000);
    // Check no shares have decreased
    expect(finalNoShares).toBeLessThan(initialNoShares);

    const finalBalance = await banksClient.getBalance(betAccountKey);
    console.log("finalBalance after buy", finalBalance);
    expect(Number(finalBalance)).toBeGreaterThan(Number(initialBalance));

    const destinationYesKey = await getAssociatedTokenAddress(
      mintYesKey,
      participant0.publicKey
    );
    const destinationYesAccount = await getAccount(
      provider.connection,
      destinationYesKey
    );

    const destinationNoKey = await getAssociatedTokenAddress(
      mintNoKey,
      participant0.publicKey
    );
    const destinationNoAccount = await getAccount(
      provider.connection,
      destinationNoKey
    );

    expect(Number(destinationYesAccount.amount)).toBe(1000);
    expect(Number(destinationNoAccount.amount)).toBe(0);
  });

  it("should sell shares of a bet", async () => {
    // Get the bet account
    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");

    // Check initial shares
    const initialYesShares = betAccount.shares[0].toNumber();
    const initialNoShares = betAccount.shares[1].toNumber();

    console.log("initialYesShares", initialYesShares);
    console.log("initialNoShares", initialNoShares);

    const initialBalance = await banksClient.getBalance(betAccountKey);
    console.log("initialBalance before sell", initialBalance);

    const initialParticipantBalance = await banksClient.getBalance(
      participant0.publicKey
    );
    console.log(
      "initial participant balance before sell",
      initialParticipantBalance
    );

    await program.methods
      .sell(new anchor.BN(1), 0, new anchor.BN(500))
      .accountsPartial({
        signer: participant0.publicKey,
        bet: betAccountKey,
        mintYes: mintYesKey,
        mintNo: mintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([participant0])
      .rpc({ commitment: "confirmed" });

    betAccount = await program.account.bet.fetch(betAccountKey, "confirmed");

    // Check final shares
    const finalYesShares = betAccount.shares[0].toNumber();
    const finalNoShares = betAccount.shares[1].toNumber();

    console.log("finalYesShares", finalYesShares);
    console.log("finalNoShares", finalNoShares);

    // Check yes shares have decreased
    expect(finalYesShares).toBe(initialYesShares - 500);
    // Check no shares have decreased
    expect(finalNoShares).toBeGreaterThan(initialNoShares);

    const finalBalance = await banksClient.getBalance(betAccountKey);
    expect(Number(finalBalance)).toBeLessThan(Number(initialBalance));

    console.log("final bet balance", finalBalance);
    console.log("initial bet balance", initialBalance);

    const destinationYesKey = await getAssociatedTokenAddress(
      mintYesKey,
      participant0.publicKey
    );
    const destinationYesAccount = await getAccount(
      provider.connection,
      destinationYesKey
    );

    const destinationNoKey = await getAssociatedTokenAddress(
      mintNoKey,
      participant0.publicKey
    );
    const destinationNoAccount = await getAccount(
      provider.connection,
      destinationNoKey
    );

    expect(Number(destinationYesAccount.amount)).toBe(500);
    expect(Number(destinationNoAccount.amount)).toBe(0);

    const finalParticipantBalance = await banksClient.getBalance(
      participant0.publicKey
    );
    console.log("final participant after sell", finalParticipantBalance);
  });

  it("should settle a bet", async () => {
    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        BigInt(1743771394 + 1000)
      )
    );

    await program.methods
      .settleBet(new anchor.BN(1), 1)
      .accountsPartial({
        signer: admin.publicKey,
        adminState: adminAccountKey,
        bet: betAccountKey,
      })
      .signers([admin])
      .rpc({ commitment: "confirmed" });
  });

  it("should withdraw shares of a bet", async () => {
    // Create a new bet with id=2
    await program.methods
      .createBetAccount(
        new anchor.BN(2),
        new anchor.BN(100001),
        "Will ETH hit $5000 by end of 2025?",
        new anchor.BN(1743771394)
      )
      .accounts({
        signer: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc({ commitment: "confirmed" });

    // Find the bet account address
    const [newBetAccountKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    // Find mint addresses
    const [newMintYesKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_yes"),
        new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    const [newMintNoKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("mint_no"),
        new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        Buffer.from(user.publicKey.toBuffer()),
      ],
      program.programId
    );

    // Initialize the bet
    await program.methods
      .initBetAccount(new anchor.BN(2))
      .accountsPartial({
        signer: user.publicKey,
        bet: newBetAccountKey,
        mintYes: newMintYesKey,
        mintNo: newMintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc({ commitment: "confirmed" });

    // Participant0 buys 1000 shares of outcome 0
    await program.methods
      .buy(new anchor.BN(2), 0, new anchor.BN(1000))
      .accountsPartial({
        signer: participant0.publicKey,
        bet: newBetAccountKey,
        mintYes: newMintYesKey,
        mintNo: newMintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([participant0])
      .rpc({ commitment: "confirmed" });

    // Participant1 buys 500 shares of outcome 1
    await program.methods
      .buy(new anchor.BN(2), 1, new anchor.BN(500))
      .accountsPartial({
        signer: participant1.publicKey,
        bet: newBetAccountKey,
        mintYes: newMintYesKey,
        mintNo: newMintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([participant1])
      .rpc({ commitment: "confirmed" });

    // Admin settles the bet in favor of outcome 1
    await program.methods
      .settleBet(new anchor.BN(2), 1)
      .accountsPartial({
        signer: admin.publicKey,
        adminState: adminAccountKey,
        bet: newBetAccountKey,
      })
      .signers([admin])
      .rpc({ commitment: "confirmed" });

    // Get initial balances
    const initialParticipant1Balance = await banksClient.getBalance(
      participant1.publicKey
    );
    const initialBetBalance = await banksClient.getBalance(newBetAccountKey);

    // Participant1 withdraws their winning shares
    await program.methods
      .withdrawPostSettle(new anchor.BN(2), 1, new anchor.BN(500))
      .accountsPartial({
        signer: participant1.publicKey,
        bet: newBetAccountKey,
        mintYes: newMintYesKey,
        mintNo: newMintNoKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([participant1])
      .rpc({ commitment: "confirmed" });

    // Check final balances
    const finalParticipant1Balance = await banksClient.getBalance(
      participant1.publicKey
    );

    console.log("initialParticipant1Balance", initialParticipant1Balance);
    console.log("finalParticipant1Balance", finalParticipant1Balance);
    const finalBetBalance = await banksClient.getBalance(newBetAccountKey);

    console.log("finalBetBalance", finalBetBalance);

    // Verify participant1 received funds
    expect(Number(finalParticipant1Balance)).toBeGreaterThan(
      Number(initialParticipant1Balance)
    );
    // Verify bet account balance decreased
    expect(Number(finalBetBalance)).toBeLessThan(Number(initialBetBalance));

    // Check token balances after withdrawal
    const participant1NoTokenAccount = await getAssociatedTokenAddress(
      newMintNoKey,
      participant1.publicKey
    );
    const noTokenAccount = await getAccount(
      provider.connection,
      participant1NoTokenAccount
    );
    expect(Number(noTokenAccount.amount)).toBe(0); // All tokens should be burned
  });
});

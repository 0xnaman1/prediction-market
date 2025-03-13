use crate::state::bet::Bet;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction::transfer;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface};

pub fn init_bet(ctx: Context<InitBet>, bet_id: u64) -> Result<()> {
    let bet_id_bytes = bet_id.to_le_bytes();
    let signer_bytes = ctx.accounts.signer.key().to_bytes();
    let signer_seeds_yes: &[&[&[u8]]] = &[&[
        b"mint_yes",
        &bet_id_bytes,
        &signer_bytes,
        &[ctx.bumps.mint_yes],
    ]];

    let signer_seeds_no: &[&[&[u8]]] = &[&[
        b"mint_no",
        &bet_id_bytes,
        &signer_bytes,
        &[ctx.bumps.mint_no],
    ]];

    let bet = &ctx.accounts.bet;
    let share0 = bet.shares[0];
    let share1 = bet.shares[1];

    msg!("minting shares to destination accounts");

    let transfer_instruction = transfer(
        &ctx.accounts.signer.key,
        &bet.key(),
        bet.total_liq.try_into().unwrap(),
    );
    invoke_signed(
        &transfer_instruction,
        &[
            ctx.accounts.signer.to_account_info(),
            bet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[],
    )?;

    let cpi_accounts_yes = MintTo {
        mint: ctx.accounts.mint_yes.to_account_info(),
        to: ctx.accounts.destination_yes.to_account_info(),
        authority: ctx.accounts.mint_yes.to_account_info(),
    };

    let cpi_accounts_no = MintTo {
        mint: ctx.accounts.mint_no.to_account_info(),
        to: ctx.accounts.destination_no.to_account_info(),
        authority: ctx.accounts.mint_no.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context_yes =
        CpiContext::new(cpi_program.clone(), cpi_accounts_yes).with_signer(signer_seeds_yes);
    let cpi_context_no = CpiContext::new(cpi_program, cpi_accounts_no).with_signer(signer_seeds_no);

    token_interface::mint_to(cpi_context_yes, share0 as u64)?;
    token_interface::mint_to(cpi_context_no, share1 as u64)?;

    let bet = &mut ctx.accounts.bet;
    bet.is_initialized = true;

    emit!(BetInitialized {
        bet_id,
        creator: *ctx.accounts.signer.key,
        expiration_at: bet.expiration_at,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct InitBet<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bet".as_ref(), bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"mint_yes", bet.bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub mint_yes: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"mint_no", bet.bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub mint_no: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint_yes,
        associated_token::authority = signer,
    )]
    pub destination_yes: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint_no,
        associated_token::authority = signer,
    )]
    pub destination_no: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[event]
pub struct BetInitialized {
    pub bet_id: u64,
    pub creator: Pubkey,
    pub expiration_at: i64,
}

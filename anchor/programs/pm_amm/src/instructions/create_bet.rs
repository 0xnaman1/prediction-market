use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::{error::PredictionMarketError, state::bet::Bet};

use anchor_spl::token_interface::{Mint, TokenInterface};

pub fn create_bet(
    ctx: Context<CreateBet>,
    bet_id: u64,
    initial_liq: u128, // in lamports(precision 9)
    bet_prompt: String,
    expiration: i64,
) -> Result<()> {
    require!(
        initial_liq > 100000,
        PredictionMarketError::InvalidInitialLiq
    );
    let bet = &mut ctx.accounts.bet;

    let clock = Clock::get()?;

    bet.bet_id = bet_id;
    bet.total_liq = initial_liq;
    bet.outcomes = ["yes".to_string(), "no".to_string()];

    // share0 and share1 are in lamports(precision 9)
    let share0 = initial_liq
        .checked_div(2)
        .ok_or(PredictionMarketError::MathErr)?;
    let share1 = initial_liq.checked_sub(share0).unwrap();

    bet.shares = [share0, share1];

    // constant is in lamports^2(precision 18)
    bet.constant = share0
        .checked_mul(share1)
        .ok_or(PredictionMarketError::MathErr)?;

    bet.bet_prompt = bet_prompt.clone();
    bet.created_at = clock.unix_timestamp;
    bet.creator = *ctx.accounts.signer.key;
    bet.expiration_at = expiration;

    emit!(BetCreated {
        bet_id,
        creator: *ctx.accounts.signer.key,
        bet_prompt: bet_prompt,
        expiration_at: expiration,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct CreateBet<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = size_of::<Bet>() + 8,
        seeds = [b"bet".as_ref(), bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        init,
        seeds = [b"mint_yes", bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump,
        payer = signer,
        mint::decimals = 9,
        mint::authority = mint_yes.key(),
    )]
    pub mint_yes: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        seeds = [b"mint_no", bet_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump,
        payer = signer,
        mint::decimals = 9,
        mint::authority = mint_no.key(),
    )]
    pub mint_no: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct BetCreated {
    pub bet_id: u64,
    pub creator: Pubkey,
    pub bet_prompt: String,
    pub expiration_at: i64,
}

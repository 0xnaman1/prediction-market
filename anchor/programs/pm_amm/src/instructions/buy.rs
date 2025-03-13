use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction::transfer;

use crate::error::PredictionMarketError;
use crate::state::bet::Bet;
use crate::utils::Utils;
use crate::PRECISION;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, MintTo, TokenAccount, TokenInterface};

pub fn buy_instruction(ctx: Context<Buy>, bet_id: u64, outcome: u8, q: u128) -> Result<()> {
    require!(
        outcome == 0 || outcome == 1,
        PredictionMarketError::OutComeCanOnlyBe01
    );
    require!(q > 0, PredictionMarketError::QuantityMustBeGreaterThanZero);

    let price = Utils::get_price_helper(&ctx.accounts.bet, outcome)?; // in lamports(precision 9)
    msg!("price={}", price);
    let total_price = price
        .checked_mul(q)
        .ok_or(PredictionMarketError::MathErr)?
        .checked_div(PRECISION)
        .ok_or(PredictionMarketError::MathErr)?;

    let bet = &mut ctx.accounts.bet;

    require!(
        bet.side_won == None,
        PredictionMarketError::BetAlreadySettled
    );

    msg!("total price={}", total_price);

    // Transfer lamports from signer to bet account
    let transfer_instruction = transfer(
        &ctx.accounts.signer.key,
        &bet.key(),
        total_price.try_into().unwrap(),
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

    let new_shares = bet.shares[outcome as usize] + q;
    bet.shares[outcome as usize] = new_shares;

    // adjust shares of other outcomes
    bet.shares[(outcome as usize + 1) % 2] = bet.constant / new_shares;

    // update the constant
    bet.constant = bet.shares[0] * bet.shares[1];

    // mint the shares to the buyer
    let (yes_no, bump) = if outcome == 0 {
        ("mint_yes".to_string(), ctx.bumps.mint_yes)
    } else {
        ("mint_no".to_string(), ctx.bumps.mint_no)
    };
    let (destination_account, mint) = if outcome == 0 {
        (
            ctx.accounts.destination_yes.to_account_info(),
            ctx.accounts.mint_yes.to_account_info(),
        )
    } else {
        (
            ctx.accounts.destination_no.to_account_info(),
            ctx.accounts.mint_no.to_account_info(),
        )
    };

    let bet_id_bytes = bet_id.to_le_bytes();

    let signer_seeds: &[&[&[u8]]] = &[&[
        yes_no.as_bytes(),
        &bet_id_bytes,
        &ctx.accounts.bet.creator.key().to_bytes(),
        &[bump],
    ]];

    let cpi_accounts = MintTo {
        mint: mint.clone(),
        to: destination_account,
        authority: mint,
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);
    token_interface::mint_to(cpi_context, q.try_into().unwrap())?;

    emit!(BuyShares {
        bet_id,
        buyer: *ctx.accounts.signer.key,
        outcome,
        quantity: q,
        amount_deposit: total_price
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct Buy<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bet", bet_id.to_le_bytes().as_ref(), bet.creator.as_ref()],
        bump,
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"mint_yes", bet.bet_id.to_le_bytes().as_ref(), bet.creator.as_ref()],
        bump,
        mint::authority = mint_yes
    )]
    pub mint_yes: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [b"mint_no", bet.bet_id.to_le_bytes().as_ref(), bet.creator.as_ref()],
        bump,
        mint::authority = mint_no
    )]
    pub mint_no: Box<InterfaceAccount<'info, Mint>>,

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
pub struct BuyShares {
    pub bet_id: u64,
    pub buyer: Pubkey,
    pub outcome: u8,
    pub quantity: u128,
    pub amount_deposit: u128,
}

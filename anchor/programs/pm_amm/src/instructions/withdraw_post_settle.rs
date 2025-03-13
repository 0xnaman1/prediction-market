use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Burn, Mint, TokenAccount, TokenInterface};

use crate::{error::PredictionMarketError, state::bet::Bet};

pub fn withdraw_post_settle_instruction(
    ctx: Context<WithdrawPostSettle>,
    bet_id: u64,
    outcome: u8,
    q: u128,
) -> Result<()> {
    let bet = &ctx.accounts.bet;

    require!(bet.side_won.is_some(), PredictionMarketError::BetNotSettled);
    require!(
        outcome == 0 || outcome == 1,
        PredictionMarketError::OutComeCanOnlyBe01
    );

    let user_share_balance = if outcome == 0 {
        ctx.accounts.destination_yes.amount
    } else {
        ctx.accounts.destination_no.amount
    };

    let user_share_balance: u128 = user_share_balance.try_into().unwrap();
    require!(
        user_share_balance >= q,
        PredictionMarketError::SignerDoesntHaveEnoughTokens
    );

    // Burn the tokens
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

    let mut total_supply = 0;

    if bet.side_won.unwrap() == outcome {
        total_supply = if outcome == 0 {
            ctx.accounts.mint_yes.supply
        } else {
            ctx.accounts.mint_no.supply
        };
    }

    let bet_id_bytes = bet_id.to_le_bytes();

    let signer_seeds: &[&[&[u8]]] = &[&[
        yes_no.as_bytes(),
        &bet_id_bytes,
        &ctx.accounts.bet.creator.key().to_bytes(),
        &[bump],
    ]];

    let cpi_accounts = Burn {
        mint: mint.clone(),
        from: destination_account,
        authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);
    token_interface::burn(cpi_context, q.try_into().unwrap())?;

    let shares_to_reduce = bet.shares[outcome as usize]
        .checked_mul(q)
        .unwrap()
        .checked_div(total_supply.try_into().unwrap())
        .unwrap();
    let rent_balance = Rent::get()?.minimum_balance(bet.to_account_info().data_len());
    let bet_sol_balance = **bet.to_account_info().lamports.borrow() - rent_balance;
    // let total_sol_to_pay =
    //     (bet_sol_balance * shares_to_reduce) / bet.shares[bet.side_won.unwrap() as usize];
    let bet_sol_balance: u128 = bet_sol_balance.try_into().unwrap();
    let total_sol_to_pay = bet_sol_balance
        .checked_mul(shares_to_reduce)
        .unwrap()
        .checked_div(bet.shares[bet.side_won.unwrap() as usize])
        .unwrap();

    // pay the user if he owns the winning shares
    require!(
        bet_sol_balance >= total_sol_to_pay,
        PredictionMarketError::NotEnoughLamports
    );

    let total_sol_to_pay: u64 = total_sol_to_pay.try_into().unwrap();

    bet.sub_lamports(total_sol_to_pay)?;
    ctx.accounts.signer.add_lamports(total_sol_to_pay)?;

    emit!(WithdrawPrize {
        bet_id,
        outcome,
        quantity: q,
        amount_withdraw: total_sol_to_pay,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct WithdrawPostSettle<'info> {
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
pub struct WithdrawPrize {
    pub bet_id: u64,
    pub outcome: u8,
    pub quantity: u128,
    pub amount_withdraw: u64,
}

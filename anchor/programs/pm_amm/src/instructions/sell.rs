use crate::PRECISION;
use crate::{error::PredictionMarketError, state::bet::Bet, utils::Utils};
use anchor_lang::prelude::*;


use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, Burn};

// / Sell shares of a bet, 0 for yes, 1 for no and q for quantity of shares.
// / q is the quantity of shares to sell
pub fn sell_instruction(ctx: Context<Sell>, bet_id: u64, outcome: u8, q: u128) -> Result<()> {
    require!(
        outcome == 0 || outcome == 1,
        PredictionMarketError::OutComeCanOnlyBe01
    );
    require!(q > 0, PredictionMarketError::QuantityMustBeGreaterThanZero);

    let user_share_balance = if outcome == 0 {
        ctx.accounts.destination_yes.amount
    } else {
        ctx.accounts.destination_no.amount
    };

    let user_share_balance: u128 = user_share_balance.try_into().unwrap();
    require!(user_share_balance >= q, PredictionMarketError::SignerDoesntHaveEnoughTokens);

    // burn the tokens
    let (yes_no, bump) = if outcome == 0 {
        ("mint_yes".to_string(), ctx.bumps.mint_yes)
    } else {
        ("mint_no".to_string(), ctx.bumps.mint_no)
    };
    
    let (destination_account, mint) = if outcome == 0 {
        (ctx.accounts.destination_yes.to_account_info(), ctx.accounts.mint_yes.to_account_info())
    } else {
        (ctx.accounts.destination_no.to_account_info(), ctx.accounts.mint_no.to_account_info())
    };

    // require that the signer is not selling more than total shares.
    let total_supply = if outcome == 0 {
        ctx.accounts.mint_yes.supply
    } else {
        ctx.accounts.mint_no.supply
    };
    // NOTE: total supply ∝ total shares
    let price = Utils::get_price_helper(&ctx.accounts.bet, outcome)?;

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
        authority: ctx.accounts.signer.to_account_info()
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);
    token_interface::burn(cpi_context, q.try_into().unwrap())?;

    let bet = &mut ctx.accounts.bet;

    // let shares_to_reduce = (bet.shares[outcome as usize] / total_supply) * q;
    let shares_to_reduce = bet.shares[outcome as usize].checked_mul(q).unwrap().checked_div(total_supply.try_into().unwrap()).unwrap();
    let withdraw_sol_amount = price.checked_mul(shares_to_reduce).unwrap().checked_div(PRECISION).unwrap();

    require!(bet.side_won == None, PredictionMarketError::BetAlreadySettled);

    // require that the Bet account has enough lamports to pay the user
    let bet = &mut ctx.accounts.bet;
    let rent_balance = Rent::get()?.minimum_balance(bet.to_account_info().data_len());
    let bet_sol_balance = **bet.to_account_info().lamports.borrow() - rent_balance;

    let amount_to_withdraw: u64 = withdraw_sol_amount.try_into().unwrap();

    require!(bet_sol_balance>= amount_to_withdraw, PredictionMarketError::NotEnoughLamports);

    // transfer the lamports from the bet account to the signer
    bet.sub_lamports(amount_to_withdraw)?;
    ctx.accounts.signer.add_lamports(amount_to_withdraw)?;

    // adjust shares of other outcome & constant
    require!(shares_to_reduce <= bet.shares[outcome as usize], PredictionMarketError::NotEnoughSharesToReduce);
    let new_shares = bet.shares[outcome as usize] - shares_to_reduce;
    bet.shares[outcome as usize] = new_shares;
    bet.shares[(outcome as usize + 1) % 2] = bet.constant / new_shares;
    bet.constant = bet.shares[0] * bet.shares[1];

    emit!(SellShares {
        bet_id,
        seller: *ctx.accounts.signer.key,
        outcome,
        quantity: q,
        amount_withdraw: withdraw_sol_amount
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct Sell<'info> {
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
pub struct SellShares {
    pub bet_id: u64,
    pub seller: Pubkey,
    pub outcome: u8,
    pub quantity: u128,
    pub amount_withdraw: u128
}
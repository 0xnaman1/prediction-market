#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod pm_amm {
    use super::*;

  pub fn close(_ctx: Context<ClosePmAmm>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.pm_amm.count = ctx.accounts.pm_amm.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.pm_amm.count = ctx.accounts.pm_amm.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializePmAmm>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.pm_amm.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializePmAmm<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + PmAmm::INIT_SPACE,
  payer = payer
  )]
  pub pm_amm: Account<'info, PmAmm>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct ClosePmAmm<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub pm_amm: Account<'info, PmAmm>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub pm_amm: Account<'info, PmAmm>,
}

#[account]
#[derive(InitSpace)]
pub struct PmAmm {
  count: u8,
}

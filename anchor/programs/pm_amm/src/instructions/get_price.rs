use anchor_lang::prelude::*;

use crate::{error::PredictionMarketError, state::bet::Bet, utils::Utils};

pub fn get_price_instruction(ctx: Context<GetPrice>, outcome: u8) -> Result<u64> {
    require!(
        outcome == 0 || outcome == 1,
        PredictionMarketError::OutComeCanOnlyBe01
    );
    Ok(Utils::get_price_helper(&ctx.accounts.bet, outcome)? as u64)
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,
}

use crate::{error::PredictionMarketError, state::bet::Bet, PRECISION};
use anchor_lang::prelude::*;

pub struct Utils;

impl Utils {
    /// Get the price of a share of a bet.
    pub fn get_price_helper(bet: &Account<'_, Bet>, outcome: u8) -> Result<u128> {
        require!(
            outcome == 0 || outcome == 1,
            PredictionMarketError::OutComeCanOnlyBe01
        );
        let outcome_share = bet.shares[outcome as usize]; // in lamports(precision 9)
        msg!("outcome_share={}", outcome_share);
        let total_shares = bet.shares[0] + bet.shares[1]; // in lamports(precision 9)
        msg!("total_shares={}", total_shares);
        msg!("divided price={}", outcome_share / total_shares);

        msg!("Converting to precision 18");

        let result = outcome_share
            .checked_mul(PRECISION)
            .ok_or(PredictionMarketError::MathErr)?
            .checked_div(total_shares)
            .ok_or(PredictionMarketError::MathErr)?;
        Ok(result)
    }
}

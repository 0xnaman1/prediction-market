pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;

use instructions::*;

declare_id!("CNqGv5P92gnmnFEHqk2csdw1v8by2U5Q1CVwZZbBnguE");

const PRECISION: u128 = 1_000_000_000;

#[program]
pub mod pm_amm {
    use super::*;

    pub fn initialize(ctx: Context<InitializeAdmin>) -> Result<()> {
        init_admin_state(ctx)
    }

    pub fn create_bet_account(
        ctx: Context<CreateBet>,
        bet_id: u64,
        initial_liq: u128,
        bet_prompt: String,
        expiration_at: i64,
    ) -> Result<()> {
        create_bet(ctx, bet_id, initial_liq, bet_prompt, expiration_at)
    }

    pub fn init_bet_account(ctx: Context<InitBet>, bet_id: u64) -> Result<()> {
        init_bet(ctx, bet_id)
    }

    pub fn get_price(ctx: Context<GetPrice>, outcome: u8) -> Result<u64> {
        get_price_instruction(ctx, outcome)
    }

    // / Buy shares of a bet, 0 for yes, 1 for no and q for quantity of shares.
    pub fn buy(ctx: Context<Buy>, bet_id: u64, outcome: u8, q: u128) -> Result<()> {
        buy_instruction(ctx, bet_id, outcome, q)
    }

    /// Sell shares of a bet, 0 for yes, 1 for no and q for quantity of shares.
    pub fn sell(ctx: Context<Sell>, bet_id: u64, outcome: u8, q: u128) -> Result<()> {
        sell_instruction(ctx, bet_id, outcome, q)
    }

    /// Only the settle_pubkey from `Admin` can call this function.
    pub fn settle_bet(ctx: Context<SettleBet>, bet_id: u64, side_won: u8) -> Result<()> {
        settle_bet_instruction(ctx, bet_id, side_won)
    }

    /// Withdraw shares after bet has been settled
    pub fn withdraw_post_settle(
        ctx: Context<WithdrawPostSettle>,
        bet_id: u64,
        outcome: u8,
        q: u128,
    ) -> Result<()> {
        withdraw_post_settle_instruction(ctx, bet_id, outcome, q)
    }
}

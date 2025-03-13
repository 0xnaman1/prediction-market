use anchor_lang::prelude::*;

#[account]
pub struct Bet {
    pub bet_id: u64,
    pub total_liq: u128, // in lamports(precision 9)
    pub constant: u128,  // in lamports^2(precision 18)
    pub outcomes: [String; 2],
    pub shares: [u128; 2], // in lamports(precision 9)
    pub bet_prompt: String,
    pub is_initialized: bool,
    // by default none
    pub side_won: Option<u8>,
    pub expiration_at: i64,
    pub created_at: i64,
    pub creator: Pubkey,
}

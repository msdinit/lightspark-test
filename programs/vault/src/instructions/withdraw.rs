use anchor_lang::prelude::*;

use crate::{
    constants::*,
    state::VaultState,
};

#[derive(Accounts)]
pub struct Withdraw<'info> {

    #[account(
        seeds = [VAULT_STATE_SEED.as_bytes()],
        bump = vault_state.vault_state_bump,
        has_one = authority,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        mut,
        seeds = [VAULT_SEED.as_bytes()],
        bump = vault_state.vault_bump,
    )]
    /// CHECK: Vault PDA that holds lamports
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Withdraw>,
    amount: u64,
) -> Result<()> {

    let vault = ctx.accounts.vault.to_account_info();
    let authority = ctx.accounts.authority.to_account_info();

    **vault.try_borrow_mut_lamports()? -= amount;
    **authority.try_borrow_mut_lamports()? += amount;

    msg!("Withdrawn {} lamports", amount);

    Ok(())
}

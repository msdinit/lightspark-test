use anchor_lang::prelude::* ; 

use crate::{ state::VaultState} ; 

use crate::constants::{
    VAULT_SEED,
    VAULT_STATE_SEED,
};

#[derive(Accounts)] 

pub struct Initialize<'info> {
    #[account(
        init , 
        payer = signer , 
        space = 8 + 32 + 1 + 1 , 
        seeds = [VAULT_STATE_SEED.as_bytes()] , 
        bump 

    )]


    pub vault_state : Account<'info , VaultState >  , 

    #[account(
        init , 
        payer = signer , 
        space = 8, 
        seeds = [VAULT_SEED.as_bytes()], 
        bump , 
    )]

    /// CHECK: Vault PDA that will hold lamports
    pub vault : UncheckedAccount<'info> , 

   
    #[account(mut)] 
    pub signer : Signer<'info> , 
    pub system_program : Program<'info , System> , 
}

pub fn handler (ctx : Context<Initialize> )-> Result<()>{
    let vault_state = &mut ctx.accounts.vault_state; 
    vault_state.authority = ctx.accounts.signer.key() ; 
    vault_state.vault_state_bump = ctx.bumps.vault_state; 
    vault_state.vault_bump = ctx.bumps.vault ; 


    msg!("Vault initialized");

    msg!("Authority: {:?}", vault_state.authority);
    Ok(())

}
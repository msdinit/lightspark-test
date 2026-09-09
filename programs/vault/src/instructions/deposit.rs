use anchor_lang::prelude::* ; 
use anchor_lang::system_program::{
    transfer , 
    Transfer , 
} ; 


use crate::{
    constants::*  , 
    state::VaultState, 
}; 



#[derive(Accounts)] 
pub struct Deposit<'info> {

    #[account(
        mut , 
        seeds = [VAULT_STATE_SEED.as_bytes()], 
        bump = vault_state.vault_state_bump , 
    )]

    pub vault_state :Account<'info , VaultState> , 

    #[account ( 
        mut , 
        seeds = [VAULT_SEED.as_bytes()] , 
        bump = vault_state.vault_bump ,
    )]
    
    /// CHECK: Vault PDA that holds lamports
    pub vault: UncheckedAccount<'info>  , 

    #[account(mut)] 
    pub signer : Signer<'info> , 

    pub system_program : Program<'info , System > 


}
pub fn handler (ctx : Context<Deposit> , amount : u64 ) -> Result<()> {
    let cpi_accounts = Transfer{
        from: ctx.accounts.signer.to_account_info(),
        to : ctx.accounts.vault.to_account_info(),
    } ; 

    let cpi_program =
        ctx.accounts.system_program.to_account_info();

    let cpi_context =
        CpiContext::new(cpi_program.key(), cpi_accounts);

    transfer(cpi_context, amount)?;

    msg!("Deposited {} lamports", amount);

    Ok(())
    
}
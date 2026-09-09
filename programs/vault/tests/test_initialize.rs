use {
    anchor_lang::{
        InstructionData,
        solana_program::instruction::{AccountMeta, Instruction},
    },

    litesvm::LiteSVM,

    solana_keypair::Keypair,

    solana_message::{
        Message,
        VersionedMessage,
    },

    solana_pubkey::Pubkey,

    solana_signer::Signer,

    solana_transaction::versioned::VersionedTransaction,

    vault::{
        VAULT_SEED,
        VAULT_STATE_SEED,
    },
};

fn send_tx(
    svm: &mut LiteSVM,
    payer: &Keypair,
    instructions: Vec<Instruction>,
) {
    let blockhash = svm.latest_blockhash();

    let msg = Message::new_with_blockhash(
        &instructions,
        Some(&payer.pubkey()),
        &blockhash,
    );

    let tx = VersionedTransaction::try_new(
        VersionedMessage::Legacy(msg),
        &[payer],
    )
    .unwrap();

    svm.send_transaction(tx)
        .unwrap();
}

fn build_initialize_ix(
    program_id: Pubkey,
    vault_state_pda: Pubkey,
    vault_pda: Pubkey,
    signer: Pubkey,
) -> Instruction {
    Instruction::new_with_bytes(
        program_id,
        &vault::instruction::Initialize {}.data(),
        vec![
            AccountMeta::new(vault_state_pda, false),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new(signer, true),
            AccountMeta::new_readonly(anchor_lang::system_program::ID, false),
        ],
    )
}

fn build_deposit_ix(
    program_id: Pubkey,
    vault_state_pda: Pubkey,
    vault_pda: Pubkey,
    signer: Pubkey,
    amount: u64,
) -> Instruction {
    Instruction::new_with_bytes(
        program_id,
        &vault::instruction::Deposit { amount }.data(),
        vec![
            AccountMeta::new(vault_state_pda, false),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new(signer, true),
            AccountMeta::new_readonly(anchor_lang::system_program::ID, false),
        ],
    )
}

fn build_withdraw_ix(
    program_id: Pubkey,
    vault_state_pda: Pubkey,
    vault_pda: Pubkey,
    authority: Pubkey,
    amount: u64,
) -> Instruction {
    Instruction::new_with_bytes(
        program_id,
        &vault::instruction::Withdraw { amount }.data(),
        vec![
            AccountMeta::new_readonly(vault_state_pda, false),
            AccountMeta::new(vault_pda, false),
            AccountMeta::new(authority, true),
            AccountMeta::new_readonly(anchor_lang::system_program::ID, false),
        ],
    )
}

#[test]
fn test_initialize() {
    let program_id = vault::id();
    let payer = Keypair::new();

    let (vault_state_pda, _vault_state_bump) =
        Pubkey::find_program_address(&[VAULT_STATE_SEED.as_bytes()], &program_id);

    let (vault_pda, _vault_bump) =
        Pubkey::find_program_address(&[VAULT_SEED.as_bytes()], &program_id);

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/vault.so");
    svm.add_program(program_id, bytes).unwrap();

    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();

    let initialize_ix = build_initialize_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
    );

    send_tx(&mut svm, &payer, vec![initialize_ix]);

    let vault_state_account = svm.get_account(&vault_state_pda).unwrap();
    assert!(vault_state_account.lamports > 0);
    assert_eq!(vault_state_account.owner, program_id);

    let vault_account = svm.get_account(&vault_pda).unwrap();
    assert!(vault_account.lamports > 0);
    assert_eq!(vault_account.owner, program_id);
}

#[test]
fn test_deposit() {
    let program_id = vault::id();
    let payer = Keypair::new();

    let (vault_state_pda, _vault_state_bump) =
        Pubkey::find_program_address(&[VAULT_STATE_SEED.as_bytes()], &program_id);

    let (vault_pda, _vault_bump) =
        Pubkey::find_program_address(&[VAULT_SEED.as_bytes()], &program_id);

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/vault.so");
    svm.add_program(program_id, bytes).unwrap();

    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();

    let initialize_ix = build_initialize_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
    );

    send_tx(&mut svm, &payer, vec![initialize_ix]);

    let vault_before = svm.get_account(&vault_pda).unwrap().lamports;
    let deposit_amount = 100_000_000;

    let deposit_ix = build_deposit_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        deposit_amount,
    );

    send_tx(&mut svm, &payer, vec![deposit_ix]);

    let vault_after = svm.get_account(&vault_pda).unwrap().lamports;
    assert_eq!(vault_after, vault_before + deposit_amount);
}

#[test]
fn test_withdraw() {
    let program_id = vault::id();
    let payer = Keypair::new();

    let (vault_state_pda, _vault_state_bump) =
        Pubkey::find_program_address(&[VAULT_STATE_SEED.as_bytes()], &program_id);

    let (vault_pda, _vault_bump) =
        Pubkey::find_program_address(&[VAULT_SEED.as_bytes()], &program_id);

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/vault.so");
    svm.add_program(program_id, bytes).unwrap();

    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();

    let initialize_ix = build_initialize_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
    );

    send_tx(&mut svm, &payer, vec![initialize_ix]);

    let deposit_amount = 100_000_000;
    let deposit_ix = build_deposit_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        deposit_amount,
    );

    send_tx(&mut svm, &payer, vec![deposit_ix]);

    let vault_before = svm.get_account(&vault_pda).unwrap().lamports;
    let withdraw_amount = 50_000_000;

    let withdraw_ix = build_withdraw_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        withdraw_amount,
    );

    send_tx(&mut svm, &payer, vec![withdraw_ix]);

    let vault_after = svm.get_account(&vault_pda).unwrap().lamports;
    assert_eq!(vault_after, vault_before - withdraw_amount);
}

#[test]
fn test_withdraw_unauthorized_fails() {
    let program_id = vault::id();
    let payer = Keypair::new();
    let attacker = Keypair::new();

    let (vault_state_pda, _vault_state_bump) =
        Pubkey::find_program_address(&[VAULT_STATE_SEED.as_bytes()], &program_id);

    let (vault_pda, _vault_bump) =
        Pubkey::find_program_address(&[VAULT_SEED.as_bytes()], &program_id);

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/vault.so");
    svm.add_program(program_id, bytes).unwrap();

    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    let initialize_ix = build_initialize_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
    );

    send_tx(&mut svm, &payer, vec![initialize_ix]);

    let deposit_amount = 100_000_000;
    let deposit_ix = build_deposit_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        deposit_amount,
    );

    send_tx(&mut svm, &payer, vec![deposit_ix]);

    let withdraw_ix = build_withdraw_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        attacker.pubkey(),
        50_000_000,
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(
        &[withdraw_ix],
        Some(&attacker.pubkey()),
        &blockhash,
    );
    let tx = VersionedTransaction::try_new(
        VersionedMessage::Legacy(msg),
        &[&attacker],
    )
    .unwrap();

    let result = svm.send_transaction(tx);
    assert!(result.is_err());
}

#[test]
fn test_vault_flow() {
    let program_id = vault::id();
    let payer = Keypair::new();

    let (vault_state_pda, _vault_state_bump) =
        Pubkey::find_program_address(&[VAULT_STATE_SEED.as_bytes()], &program_id);

    let (vault_pda, _vault_bump) =
        Pubkey::find_program_address(&[VAULT_SEED.as_bytes()], &program_id);

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!("../../../target/deploy/vault.so");
    svm.add_program(program_id, bytes).unwrap();

    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();

    /* INITIALIZE */
    let initialize_ix = build_initialize_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
    );

    send_tx(&mut svm, &payer, vec![initialize_ix]);

    let vault_before = svm.get_account(&vault_pda).unwrap().lamports;

    /* DEPOSIT */
    let deposit_amount = 100_000_000;
    let deposit_ix = build_deposit_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        deposit_amount,
    );

    send_tx(&mut svm, &payer, vec![deposit_ix]);

    let vault_after_deposit = svm.get_account(&vault_pda).unwrap().lamports;
    assert_eq!(vault_after_deposit, vault_before + deposit_amount);

    /* WITHDRAW */
    let withdraw_amount = 50_000_000;
    let withdraw_ix = build_withdraw_ix(
        program_id,
        vault_state_pda,
        vault_pda,
        payer.pubkey(),
        withdraw_amount,
    );

    send_tx(&mut svm, &payer, vec![withdraw_ix]);

    let vault_after_withdraw = svm.get_account(&vault_pda).unwrap().lamports;
    assert_eq!(vault_after_withdraw, vault_after_deposit - withdraw_amount);
}

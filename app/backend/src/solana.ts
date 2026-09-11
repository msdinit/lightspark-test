import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import bs58 from "bs58";

const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const MERCHANT_ADDRESS =
    process.env.MERCHANT_ADDRESS || (() => { throw new Error("Missing MERCHANT_ADDRESS environment variable") })();

export const connection = new Connection(RPC_URL, "confirmed");

export function generatePaymentKeypair(): {
  keypair: Keypair;
  address: string;
  secretKey: string;
} {
  const keypair = Keypair.generate();
  return {
    keypair,
    address: keypair.publicKey.toBase58(),
    secretKey: bs58.encode(keypair.secretKey),
  };
}

export function solToLamports(amountSol: number): number {
  return Math.round(amountSol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export async function getBalanceLamports(address: string): Promise<number> {
  return connection.getBalance(new PublicKey(address), "confirmed");
}

export async function findFundingSignature(
  address: string,
): Promise<string | null> {
  const pubkey = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(pubkey, {
    limit: 5,
  });
  return signatures[0]?.signature ?? null;
}

export async function sendPayment(
    key: string,
    amountLamports: number
): Promise<string | null> {
  const secretKey = bs58.decode(key);
  const senderKeypair = Keypair.fromSecretKey(secretKey);

  const merchantPubkey = new PublicKey(MERCHANT_ADDRESS);

  const totalBalance = await connection.getBalance(senderKeypair.publicKey);

  const dummyTransferInstruction = SystemProgram.transfer({
    fromPubkey: senderKeypair.publicKey,
    toPubkey: merchantPubkey,
    lamports: 0,
  });
  const dummyTransaction = new Transaction().add(dummyTransferInstruction);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  dummyTransaction.recentBlockhash = blockhash;
  dummyTransaction.feePayer = senderKeypair.publicKey;
  const feeResponse = await connection.getFeeForMessage(dummyTransaction.compileMessage(), "confirmed");
  const transactionFee = feeResponse.value;
  if (transactionFee === null) {
    throw new Error("unable to get transaction fee");
  }

  const sendValue = Math.min(totalBalance - transactionFee, amountLamports);

  const transferInstruction = SystemProgram.transfer({
    fromPubkey: senderKeypair.publicKey,
    toPubkey: merchantPubkey,
    lamports: sendValue,
  });
  const transaction = new Transaction().add(transferInstruction);
  return sendAndConfirmTransaction(
      connection,
      transaction,
      [senderKeypair] // Signers array
  );
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

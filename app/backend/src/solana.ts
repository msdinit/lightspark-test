import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";

const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

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

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

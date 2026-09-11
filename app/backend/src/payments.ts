import { v4 as uuidv4 } from "uuid";
import {
  createPayment,
  getPayment,
  listPayments,
} from "./store.js";
import {
  explorerAddressUrl,
  explorerTxUrl,
  generatePaymentKeypair,
  solToLamports,
} from "./solana.js";
import type { Payment, PublicPayment } from "./types.js";

const DEFAULT_AMOUNT_SOL = Number(process.env.DEFAULT_AMOUNT_SOL ?? 0.01);
const PAYMENT_TTL_MS = Number(process.env.PAYMENT_TTL_MS ?? 30 * 60 * 1000);

export function toPublicPayment(payment: Payment): PublicPayment & {
  explorerAddressUrl: string;
  explorerTxUrl: string | null;
  settlementTxUrl: string | null;
} {
  const { secretKey: _secret, ...rest } = payment;
  return {
    ...rest,
    explorerAddressUrl: explorerAddressUrl(payment.address),
    explorerTxUrl: payment.signature
      ? explorerTxUrl(payment.signature)
      : null,
    settlementTxUrl: payment.settlementSignature
        ? explorerTxUrl(payment.settlementSignature)
        : null,
  };
}

export function createOneTimePayment(amountSolInput?: number) {
  const amountSol = amountSolInput ?? DEFAULT_AMOUNT_SOL;

  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error("amountSol must be a positive number");
  }
  if (amountSol > 10) {
    throw new Error("amountSol too large for demo (max 10 SOL)");
  }

  const { address, secretKey } = generatePaymentKeypair();
  const now = Date.now();

  const payment = createPayment({
    id: uuidv4(),
    address,
    secretKey,
    amountSol,
    amountLamports: solToLamports(amountSol),
    status: "pending",
    createdAt: new Date(now).toISOString(),
    paidAt: null,
    expiresAt: new Date(now + PAYMENT_TTL_MS).toISOString(),
    signature: null,
    settledAt: null,
    settlementSignature: null
  });

  return toPublicPayment(payment);
}

export function getPublicPayment(id: string) {
  const payment = getPayment(id);
  if (!payment) return null;
  return toPublicPayment(payment);
}

export function listPublicPayments() {
  return listPayments()
    .map(toPublicPayment)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function settle(id: string) {
  const payment = getPayment(id);
  if (!payment) return null;
}

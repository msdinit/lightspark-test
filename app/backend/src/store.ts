import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Payment } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DATA_FILE = join(DATA_DIR, "payments.json");

function ensureStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readAll(): Payment[] {
  ensureStore();
  const raw = readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw) as Payment[];
}

function writeAll(payments: Payment[]): void {
  ensureStore();
  writeFileSync(DATA_FILE, JSON.stringify(payments, null, 2), "utf8");
}

export function createPayment(payment: Payment): Payment {
  const payments = readAll();
  payments.push(payment);
  writeAll(payments);
  return payment;
}

export function getPayment(id: string): Payment | undefined {
  return readAll().find((p) => p.id === id);
}

export function listPayments(): Payment[] {
  return readAll();
}

export function updatePayment(
  id: string,
  patch: Partial<Payment>,
): Payment | undefined {
  const payments = readAll();
  const index = payments.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  payments[index] = { ...payments[index], ...patch };
  writeAll(payments);
  return payments[index];
}

export function listPendingPayments(): Payment[] {
  return readAll().filter((p) => p.status === "pending");
}

export function listPaymentsToSettle(): Payment[] {
  return readAll().filter((p) => p.status === "settling");
}

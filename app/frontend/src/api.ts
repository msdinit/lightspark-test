export type PaymentStatus = "pending" | "paid" | "expired" | "settling" | "settled";
export const TransientPaymentStates: PaymentStatus[] = ["pending", "settling"] as const;

export interface Payment {
  id: string;
  address: string;
  amountLamports: number;
  amountSol: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string;
  signature: string | null;
  settledAt: string | null;
  settlementSignature: string | null;
  explorerAddressUrl: string;
  explorerTxUrl: string | null;
  settlementTxUrl: string | null;
}

export async function createPayment(amountSol: number): Promise<Payment> {
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountSol }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create payment");
  }
  return data as Payment;
}

export async function getPayment(id: string): Promise<Payment> {
  const res = await fetch(`/api/payments/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load payment");
  }
  return data as Payment;
}

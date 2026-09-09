export type PaymentStatus = "pending" | "paid" | "expired";

export interface Payment {
  id: string;
  address: string;
  /** Base58 secret key — demo only; use a KMS/HSM in production. */
  secretKey: string;
  amountLamports: number;
  amountSol: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string;
  signature: string | null;
}

export type PublicPayment = Omit<Payment, "secretKey">;

import { useEffect, useState, type FormEvent } from "react";
import {createPayment, getPayment, type Payment, TransientPaymentStates} from "./api.js";

function statusHint(status: Payment["status"]): string {
  if (status === "pending") {
    return "Waiting for a confirmed Devnet transfer. Status updates automatically.";
  }
  if (status === "settling") {
    return "Waiting for a settlement transaction. Status updates automatically.";
  }
  if (status === "paid") {
    return "Payment confirmed on Devnet.";
  }
  return "This payment address expired before funds arrived.";
}

export default function App() {
  const [amount, setAmount] = useState("0.01");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!payment || !TransientPaymentStates.includes(payment.status)) return;

    const id = payment.id;
    const timer = window.setInterval(async () => {
      try {
        const next = await getPayment(id);
        setPayment(next);
      } catch {
        // keep polling through transient network errors
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [payment?.id, payment?.status]);

  async function onPay(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const next = await createPayment(Number(amount));
      setPayment(next);
    } catch (err) {
      setPayment(null);
      setError(err instanceof Error ? err.message : "Failed to create payment");
    } finally {
      setCreating(false);
    }
  }

  async function onCopy() {
    if (!payment) return;
    await navigator.clipboard.writeText(payment.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function onNewPayment() {
    setPayment(null);
    setError(null);
    setCopied(false);
  }

  if (!payment) {
    return (
      <main className="shell">
        <h1 className="brand">
          Vault <span>Pay</span>
        </h1>
        <p className="lede">
          One-time Solana Devnet addresses. Click Pay, send SOL, and we watch the
          chain until it lands.
        </p>
        <section className="panel">
          <form onSubmit={onPay}>
            <div className="field">
              <label htmlFor="amount">Amount (SOL)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.001"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="actions">
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? "Creating…" : "Pay"}
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </form>
        </section>
        <p className="footer-note">Devnet only · address expires in 30 minutes</p>
      </main>
    );
  }

  return (
    <main className="shell payment">
      <h1 className="brand">
        Vault <span>Pay</span>
      </h1>
      <p className="lede">Send exactly this amount to the one-time address below.</p>
      <section className="panel">
        <div className="status-row">
          <span className={`badge ${payment.status}`}>{payment.status}</span>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            id {payment.id.slice(0, 8)}
          </span>
        </div>
        <p className="amount">{payment.amountSol} SOL</p>
        <div className="meta">
          <div className="meta-item">
            <label>Payment address</label>
            <code className="address">{payment.address}</code>
          </div>
        </div>
        <p className="hint">{statusHint(payment.status)}</p>
        <div className="links">
          <a href={payment.explorerAddressUrl} target="_blank" rel="noreferrer">
            View address
          </a>
          {payment.explorerTxUrl ? (
            <a href={payment.explorerTxUrl} target="_blank" rel="noreferrer">
              View payment transaction
            </a>
          ) : null
          }
          {payment.settlementTxUrl ? (
              <a href={payment.settlementTxUrl} target="_blank" rel="noreferrer">
                View settlement transaction
              </a>
          ) : null
          }
        </div>
        <div className="actions">
          <button className="btn-ghost" type="button" onClick={onCopy}>
            {copied ? "Copied" : "Copy address"}
          </button>
          <button className="btn-ghost" type="button" onClick={onNewPayment}>
            New payment
          </button>
        </div>
      </section>
    </main>
  );
}

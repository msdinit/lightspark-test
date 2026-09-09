import {
  findFundingSignature,
  getBalanceLamports,
} from "./solana.js";
import {
  listPendingPayments,
  updatePayment,
} from "./store.js";
import solana_kit from "../scripts/solana-kit.min.js"
const POLL_MS = Number(process.env.PAYMENT_POLL_MS ?? 3000);

export function startPaymentWatcher(): NodeJS.Timeout {
  console.log(`[watcher] polling every ${POLL_MS}ms`);
  return setInterval(async () => {
    const pending = listPendingPayments();
    const sk = solana_kit;
    
    if (pending.length === 0) return;

    const now = Date.now();

    for (const payment of pending) {
      try {
        if (now > Date.parse(payment.expiresAt)) {
          updatePayment(payment.id, { status: "expired" });
          console.log(`[watcher] expired ${payment.id}`);
          continue;
        }

        const balance = await getBalanceLamports(payment.address);
        if (balance < payment.amountLamports) continue;

        const signature = await findFundingSignature(payment.address);
        updatePayment(payment.id, {
          status: "paid",
          paidAt: new Date().toISOString(),
          signature,
        });
        console.log(
          `[watcher] paid ${payment.id} balance=${balance} sig=${signature}`,
        );
      } catch (err) {
        console.error(`[watcher] error checking ${payment.id}`, err);
      }
    }
  }, POLL_MS);
}


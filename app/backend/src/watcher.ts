import {
  findFundingSignature,
  getBalanceLamports, sendPayment,
} from "./solana.js";
import {
  listPaymentsToSettle,
  listPendingPayments,
  updatePayment,
} from "./store.js";
import solana_kit from "../scripts/solana-kit.min.js"
const POLL_MS = Number(process.env.PAYMENT_POLL_MS ?? 3000);
const SETTLE_POLL_MS = Number(process.env.SETTLEMENT_POLL_MS ?? 3000);

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
        // currently will skip "paid" and go straight to "settling", sufficient for PoC
        updatePayment(payment.id, {
          status: "settling",
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

export function startSettlerWatcher(): NodeJS.Timeout {
  console.log(`[settler] polling every ${SETTLE_POLL_MS}ms`);
  return setInterval(async () => {
    const toSettle = listPaymentsToSettle();
    const sk = solana_kit;

    if (toSettle.length === 0) return;

    for (const payment of toSettle) {
      try {

        const signature = await sendPayment(payment.secretKey, payment.amountLamports)
        const now = Date.now();
        updatePayment(payment.id, {
          status: "settled",
          settledAt: new Date().toISOString(),
          settlementSignature: signature,
        });
        console.log(
            `[settler] settled ${payment.id} sig=${signature}`,
        );
      } catch (err) {
        console.error(`[settler] error settling ${payment.id}`, err);
      }
    }
  }, SETTLE_POLL_MS);
}


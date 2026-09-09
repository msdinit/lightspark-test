# Take-home assessment: Settle paid Solana invoices

**Role focus:** Backend / full-stack engineer (Node.js + Solana)  
**Timebox:** ~3–4 hours  
**Cluster:** Solana Devnet only

You are given a **working starter app** that already:

- Creates a one-time Devnet payment address when the user clicks **Pay**
- Tracks incoming SOL and marks the payment `paid`

What it does **not** do yet: after payment, SOL stays on the temporary address forever.

---

## Your task

Implement **settlement (sweep)**:

When a payment becomes `paid`, move the received SOL from the one-time address to a configured **merchant treasury** wallet.

### Required behavior

1. Merchant treasury address comes from config (e.g. `MERCHANT_ADDRESS` in `.env`)
2. After a payment is `paid`, the app can settle it (automatically and/or via an API like `POST /api/payments/:id/settle`)
3. Settlement uses the stored one-time keypair to sign a native SOL transfer on Devnet
4. On success, payment status becomes something like `settled` (name is up to you)
5. Store the settle transaction signature
6. UI shows when a payment is settled (or at least status via API)
7. Update the README with how to configure and test settlement

### Must handle

- Do not settle twice (idempotent)
- Do not settle if status is not `paid`
- Leave enough lamports for rent / fees if needed, or document your approach
- Fail clearly if `MERCHANT_ADDRESS` is missing/invalid

### Nice to have

- Auto-settle inside the existing payment watcher after `paid`
- Show settle tx on Solana Explorer in the UI
- Retry / error field if settle fails

### Out of scope

- Mainnet
- SPL tokens
- KMS / hardware wallets
- Rebuilding the create/track flow from scratch (reuse the starter)

---

## Starter code

You will receive the existing `app/` project (backend + frontend).  
Do **not** rewrite the whole app — extend it.

Suggested touch points (not mandatory):

- `app/backend/src/solana.ts` — add transfer helper
- `app/backend/src/watcher.ts` or a new settle service
- `app/backend/src/index.ts` — optional settle endpoint
- `app/frontend/src/App.tsx` — show settled status in the React UI

---

## How we will test

1. Set `MERCHANT_ADDRESS` to a Devnet wallet we control
2. Create a small payment (e.g. `0.01` SOL) and pay it
3. Trigger settlement (auto or API)
4. Confirm:
   - one-time address balance drops
   - merchant balance increases
   - payment status is settled and a settle signature exists

---

## Deliverables

1. Modified source code
2. Short notes: how settlement works, fee/rent choices, production risks of storing secret keys

---

## Evaluation

| Area | We look for |
|------|-------------|
| Correctness | Paid funds actually move to merchant on Devnet |
| Solana | Correct signed transfer, sensible fee/rent handling |
| Safety | No double-settle; clear status transitions |
| Code quality | Small, readable change on top of the starter |
| Judgment | Honest notes on key storage / failure modes |

Working settlement matters more than extra features.

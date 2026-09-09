# Solana one-time payments (Devnet)

Node.js + React app: click **Pay**, get a fresh Solana address, track confirmation on Devnet.

## Stack

- **Backend:** Express + `@solana/web3.js` + JSON store + balance watcher
- **Frontend:** React + TypeScript (compiled with `tsc`, served by Express)
- **Cluster:** Solana Devnet

## Quick start

```bash
# terminal 1 — API
cd app/backend
cp .env.example .env
npm install
npm run dev

# terminal 2 — build React UI (once, or watch)
cd app/frontend
npm install
npm run build
# optional live rebuild:
npm run dev
```

Open **http://localhost:3001**

1. Enter an amount (default `0.01` SOL)
2. Click **Pay**
3. Send that amount from any Devnet wallet to the shown address
4. Status flips to `paid` when the watcher sees enough lamports

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payments` | Create one-time address. Body: `{ "amountSol": 0.01 }` |
| `GET` | `/api/payments/:id` | Payment status (no secret key) |
| `GET` | `/api/payments` | List payments |
| `GET` | `/api/health` | Health + RPC info |

## Notes

- Get Devnet SOL from a faucet before paying
- Secret keys are stored under `backend/data/payments.json` for this demo only
- Candidate take-home: see `TAKE_HOME.md`

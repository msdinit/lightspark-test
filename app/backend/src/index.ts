import "dotenv/config";
import cors from "cors";
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createOneTimePayment,
  getPublicPayment,
  listPublicPayments,
} from "./payments.js";
import {startPaymentWatcher, startSettlerWatcher} from "./watcher.js";

const PORT = Number(process.env.PORT ?? 3001);
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDist = join(__dirname, "..", "..", "frontend", "dist");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(frontendDist));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    cluster: "devnet",
    rpc: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  });
});

app.post("/api/payments", (req, res) => {
  try {
    const amountSol =
      req.body?.amountSol !== undefined
        ? Number(req.body.amountSol)
        : undefined;
    const payment = createOneTimePayment(amountSol);
    res.status(201).json(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment";
    res.status(400).json({ error: message });
  }
});

app.get("/api/payments", (_req, res) => {
  res.json(listPublicPayments());
});

app.get("/api/payments/:id", (req, res) => {
  const payment = getPublicPayment(req.params.id);
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(payment);
});

app.get("*", (_req, res) => {
  res.sendFile(join(frontendDist, "index.html"));
});

startPaymentWatcher();
startSettlerWatcher();

app.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT}`);
  console.log(`[ui]  http://localhost:${PORT}  (build frontend first)`);
  console.log(`[api] Solana cluster: devnet`);
});

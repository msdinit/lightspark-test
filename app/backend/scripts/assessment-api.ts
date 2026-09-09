/**
 * Minimal assessment checks against a running server.
 * Usage: npm run test:assessment
 */
const BASE = process.env.API_BASE ?? "http://localhost:3001";

let failed = 0;

function assert(id: string, ok: boolean, detail: string) {
  if (ok) console.log(`PASS  ${id}  ${detail}`);
  else {
    failed += 1;
    console.error(`FAIL  ${id}  ${detail}`);
  }
}

async function json(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function main() {
  console.log(`Assessment → ${BASE}\n`);

  const health = await json("GET", "/api/health");
  assert("1", health.status === 200 && health.data?.ok === true, "health");

  const a = await json("POST", "/api/payments", { amountSol: 0.01 });
  assert(
    "2",
    a.status === 201 &&
      a.data?.status === "pending" &&
      typeof a.data?.address === "string" &&
      !("secretKey" in (a.data ?? {})),
    "create payment (pending, address, no secretKey)",
  );

  const b = await json("POST", "/api/payments", { amountSol: 0.01 });
  assert(
    "3",
    a.data?.address && b.data?.address && a.data.address !== b.data.address,
    "each payment gets a unique address",
  );

  const bad = await json("POST", "/api/payments", { amountSol: 0 });
  assert("4", bad.status === 400, "reject invalid amount");

  console.log(failed ? `\n${failed} failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Is the server running on", BASE, "?\n", err);
  process.exit(1);
});

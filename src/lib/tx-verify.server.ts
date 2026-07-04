// Server-only on-chain verification helpers shared by tx-verify and confirmOrder server fns.

export type VerifyResult = {
  ok: boolean;
  status: "match" | "amount_mismatch" | "address_mismatch" | "wrong_token" | "not_found" | "pending" | "failed" | "error";
  message: string;
  paidAmount?: number;
  toAddress?: string;
};

const BSC_USDT = "0x55d398326f99059ff775485246999027b3197955";
const TRON_USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const BSC_RPCS = [
  "https://bsc-dataseed.binance.org/",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/",
];

async function bscRpc(method: string, params: unknown[]) {
  let lastErr: unknown;
  for (const url of BSC_RPCS) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (!r.ok) { lastErr = new Error(`RPC ${r.status}`); continue; }
      const j = await r.json();
      if (j.error) { lastErr = new Error(j.error.message); continue; }
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("All BSC RPCs failed");
}

function topicToAddress(topic: string) {
  return "0x" + topic.slice(-40).toLowerCase();
}

export async function verifyBep20(txHash: string, expectedAddress: string, expectedAmount: number): Promise<VerifyResult> {
  const hash = txHash.startsWith("0x") ? txHash : `0x${txHash}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return { ok: false, status: "not_found", message: "Invalid BEP20 transaction hash format." };
  }

  const receipt = await bscRpc("eth_getTransactionReceipt", [hash]);
  if (!receipt) return { ok: false, status: "pending", message: "Transaction not found yet — it may still be propagating. Try again in ~30 seconds." };
  if (receipt.status !== "0x1") return { ok: false, status: "failed", message: "Transaction reverted on-chain." };

  const want = expectedAddress.toLowerCase();
  const logs: any[] = receipt.logs ?? [];
  const transfer = logs.find((l) =>
    l.address?.toLowerCase() === BSC_USDT &&
    l.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC,
  );
  if (!transfer) return { ok: false, status: "wrong_token", message: "No USDT (BEP20) transfer found in this transaction." };

  const to = topicToAddress(transfer.topics[2]);
  const raw = BigInt(transfer.data);
  const paid = Number(raw) / 1e18;

  if (to !== want) {
    return { ok: false, status: "address_mismatch", message: `USDT was sent to ${to}, not to our deposit address.`, paidAmount: paid, toAddress: to };
  }
  const diff = Math.abs(paid - expectedAmount);
  if (diff > Math.max(0.5, expectedAmount * 0.01)) {
    return { ok: false, status: "amount_mismatch", message: `Amount mismatch: received ${paid.toFixed(2)} USDT, expected ${expectedAmount.toFixed(2)} USDT.`, paidAmount: paid, toAddress: to };
  }
  return { ok: true, status: "match", message: `Verified: ${paid.toFixed(2)} USDT received on BEP20.`, paidAmount: paid, toAddress: to };
}

export async function verifyTrc20(txHash: string, expectedAddress: string, expectedAmount: number): Promise<VerifyResult> {
  const hash = txHash.replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    return { ok: false, status: "not_found", message: "Invalid TRC20 transaction hash format." };
  }

  const r = await fetch(`https://apilist.tronscanapi.com/api/transaction-info?hash=${hash}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) return { ok: false, status: "error", message: `Tron explorer error (${r.status}).` };
  const data: any = await r.json();

  if (!data || (!data.hash && !data.contractRet)) {
    return { ok: false, status: "pending", message: "Transaction not found yet — it may still be propagating. Try again in ~30 seconds." };
  }
  if (data.contractRet && data.contractRet !== "SUCCESS") {
    return { ok: false, status: "failed", message: `Transaction failed on Tron (${data.contractRet}).` };
  }

  const list: any[] = data.trc20TransferInfo ?? (data.tokenTransferInfo ? [data.tokenTransferInfo] : []);
  const usdtTransfer = list.find((t) => (t.contract_address || t.contractAddress) === TRON_USDT);

  if (!usdtTransfer) return { ok: false, status: "wrong_token", message: "No USDT (TRC20) transfer found in this transaction." };

  const to = usdtTransfer.to_address || usdtTransfer.toAddress;
  const decimals = Number(usdtTransfer.decimals ?? 6);
  const amountStr: string = String(usdtTransfer.amount_str ?? usdtTransfer.quant ?? usdtTransfer.amount ?? "0");
  const paid = Number(amountStr) / Math.pow(10, decimals);

  if (to !== expectedAddress) {
    return { ok: false, status: "address_mismatch", message: `USDT was sent to ${to}, not to our deposit address.`, paidAmount: paid, toAddress: to };
  }
  const diff = Math.abs(paid - expectedAmount);
  if (diff > Math.max(0.5, expectedAmount * 0.01)) {
    return { ok: false, status: "amount_mismatch", message: `Amount mismatch: received ${paid.toFixed(2)} USDT, expected ${expectedAmount.toFixed(2)} USDT.`, paidAmount: paid, toAddress: to };
  }
  return { ok: true, status: "match", message: `Verified: ${paid.toFixed(2)} USDT received on TRC20.`, paidAmount: paid, toAddress: to };
}

// Canonical, server-authoritative price catalog. Mirrors the public pricing
// on /challenges and /instant. Keep in sync with those route files.
export const DEPOSIT_ADDRESSES = {
  bep20: "0xe82d43f2ea3aa12f140dd9a2c21d5375de6c64ae",
  trc20: "TDy7X9VYsMn4HYDaJcx36mPSkoCqW6M39h",
} as const;

const CHALLENGE_PRICES: Record<string, number> = {
  "$10K": 89, "$25K": 189, "$50K": 289, "$100K": 489, "$200K": 989, "$400K": 1200,
};
const INSTANT_PRICES: Record<string, number> = {
  // Legacy short-form sizes
  "$5K": 149, "$10K": 259, "$25K": 549, "$50K": 989, "$100K": 1749,
  // Current Instant Funded sizes (match src/routes/instant.tsx)
  "$200": 35,
  "$500": 70,
  "$1,000": 130,
  "$2,000": 240,
  "$3,000": 390,
  "$4,000": 520,
  "$5,000": 650,
  "$10,000": 1300,
  "$20,000": 2500,
  "$30,000": 3600,
  "$40,000": 5000,
  "$50,000": 6000,
};

const CHALLENGE_PLANS = new Set(["One-Step", "Two-Step"]);
const INSTANT_PLANS = new Set([
  "Instant Starter", "Instant Pro", "Instant Elite",
  "Instant Funded",
]);

export function lookupCanonicalPrice(plan: string, size: string): number | null {
  if (CHALLENGE_PLANS.has(plan)) return CHALLENGE_PRICES[size] ?? null;
  if (INSTANT_PLANS.has(plan)) return INSTANT_PRICES[size] ?? null;
  return null;
}

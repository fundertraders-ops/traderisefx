import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyBep20, verifyTrc20, type VerifyResult } from "@/lib/tx-verify.server";

export type { VerifyResult };

const inputSchema = z.object({
  network: z.enum(["bep20", "trc20"]),
  txHash: z.string().trim().min(10).max(120),
  expectedAddress: z.string().trim().min(10).max(80),
  expectedAmount: z.number().positive().max(1_000_000),
});

export const verifyUsdtTx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<VerifyResult> => {
    try {
      if (data.network === "bep20") return await verifyBep20(data.txHash, data.expectedAddress, data.expectedAmount);
      return await verifyTrc20(data.txHash, data.expectedAddress, data.expectedAmount);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { ok: false, status: "error", message: `Verification failed: ${msg}. Please try again shortly.` };
    }
  });

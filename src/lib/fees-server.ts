import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_TAX_BPS, MAX_TAX_BPS } from "@/lib/fees";

/** The tax rate that applies to the next charge. Falls back to 7.5% if unset. */
export async function loadTaxBps(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("platform_settings").select("tax_bps").eq("id", 1).maybeSingle();
    if (error || data?.tax_bps == null) return DEFAULT_TAX_BPS;
    return Math.min(MAX_TAX_BPS, Math.max(0, Math.round(data.tax_bps)));
  } catch {
    return DEFAULT_TAX_BPS;
  }
}

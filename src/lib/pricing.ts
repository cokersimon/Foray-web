/**
 * Web merchandising prices — single source of truth is the `store-pricing`
 * Edge Function / `storePricing` table (17 Jul ratified). The iOS app never uses
 * this; it renders StoreKit product prices only.
 *
 * Model: ONE yearly product — pay monthly (£5 × 12 = £60 commitment) or save
 * with one upfront payment (£54.99). Totals are intentionally unequal.
 *
 * ISR: `next: { revalidate: 86400 }`. On fetch failure, serve the last-known
 * ratified defaults.
 */

export type StorePricing = {
  monthly: number;
  upFront: number;
  total: number;
  convenienceFee: number;
  currency: string;
  updatedAt: string | null;
  source: string;
};

/** Fallback matches the Supabase seed (17 Jul): £5 × 12 / £54.99 upfront. */
export const PRICING_FALLBACK: StorePricing = {
  monthly: 5,
  upFront: 54.99,
  total: 60,
  convenienceFee: 2.49,
  currency: "GBP",
  updatedAt: null,
  source: "fallback",
};

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Display helpers — never embed digit literals in marketing JSX. */
export function formatPricing(p: StorePricing) {
  return {
    monthly: formatGbp(p.monthly),
    upFront: formatGbp(p.upFront),
    total: formatGbp(p.total),
    convenienceFee: formatGbp(p.convenienceFee),
    monthlyPlain: p.monthly.toFixed(2),
    convenienceFeePlain: p.convenienceFee.toFixed(2),
  };
}

export type FormattedPricing = ReturnType<typeof formatPricing>;

export async function fetchStorePricing(): Promise<StorePricing> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return PRICING_FALLBACK;

  try {
    const res = await fetch(`${base}/functions/v1/store-pricing`, {
      next: { revalidate: 86400 },
      headers: {
        // Public function; anon key satisfies gateway when verify_jwt is on.
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
    });
    if (!res.ok) return PRICING_FALLBACK;
    const data = (await res.json()) as Partial<StorePricing>;
    const monthly = Number(data.monthly);
    const upFront = Number(data.upFront);
    const total = Number(data.total);
    const convenienceFee = Number(data.convenienceFee);
    if (
      !Number.isFinite(monthly) ||
      !Number.isFinite(upFront) ||
      !Number.isFinite(total) ||
      !Number.isFinite(convenienceFee)
    ) {
      return PRICING_FALLBACK;
    }
    // Guard: commitment total must equal monthly × 12. Upfront may be lower (saver).
    if (Math.abs(total - monthly * 12) > 0.02) {
      console.warn("pricing: commitment total ≠ monthly × 12 — using fallback");
      return PRICING_FALLBACK;
    }
    return {
      monthly,
      upFront,
      total,
      convenienceFee,
      currency: typeof data.currency === "string" ? data.currency : "GBP",
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
      source: typeof data.source === "string" ? data.source : "storePricing",
    };
  } catch {
    return PRICING_FALLBACK;
  }
}

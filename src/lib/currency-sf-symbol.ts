import type { SfSymbolName } from "@/components/brand/sf-symbol";

/** Eurozone ISO regions that use the euro. */
const EURO_REGIONS = new Set([
  "AT",
  "BE",
  "CY",
  "DE",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PT",
  "SI",
  "SK",
  "EU",
]);

/**
 * Pick an SF currency glyph from a BCP-47 locale.
 * Default is sterling (Foray is UK-first). Falls back safely when Intl is odd.
 */
export function currencySfSymbolFromLocale(
  locale = "en-GB",
): SfSymbolName {
  try {
    const region = (
      new Intl.Locale(locale).maximize().region ?? ""
    ).toUpperCase();

    if (region === "GB" || region === "UK") return "sterlingsign";
    if (region === "US" || region === "CA") return "dollarsign";
    if (region === "AU" || region === "NZ") return "australiandollarsign";
    if (region === "JP" || region === "CN") return "yensign";
    if (EURO_REGIONS.has(region)) return "eurosign";
  } catch {
    // ignore — fall through to sterling
  }
  return "sterlingsign";
}

/** Client-side locale for currency badges (navigator, then en-GB). */
export function browserLocale(): string {
  if (typeof navigator === "undefined") return "en-GB";
  return navigator.languages?.[0] || navigator.language || "en-GB";
}

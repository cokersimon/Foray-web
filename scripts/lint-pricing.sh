#!/usr/bin/env bash
#
# Fail if marketing / pricing surfaces hardcode £+digit price literals.
# Legal liability "£100" in terms is outside the scoped paths (or uses
# store-pricing for subscription figures). See monetization FINAL supersession.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN=(
  "$ROOT/src/components/marketing"
  "$ROOT/src/app/(marketing)"
)
# Allow-list: pricing.ts holds the equal-total fallback (the only sanctioned digits).
EXCLUDE_GREP='src/lib/pricing\.ts'

fail=0
# Merchandising prices are decimal (£4.50 / £54.00). Liability "£100" in Terms is
# intentionally excluded (monetization FINAL supersession note).
PRICE_RE='£[0-9]+\.[0-9]'
for dir in "${SCAN[@]}"; do
  [ -d "$dir" ] || continue
  hits="$(grep -rEn --include='*.tsx' --include='*.ts' -E "$PRICE_RE" "$dir" | grep -vE "$EXCLUDE_GREP" || true)"
  if [ -n "$hits" ]; then
    fail=1
    echo "✗ price literal in marketing copy — fetch from store-pricing / formatPricing()"
    echo "$hits" | sed 's/^/    /'
    echo
  fi
  purged="$(grep -rEn --include='*.tsx' --include='*.ts' -E '54\.99|55\.08|4\.59|49\.99|59\.88' "$dir" || true)"
  if [ -n "$purged" ]; then
    fail=1
    echo "✗ purged price figure — update storePricing row / formatPricing consumers"
    echo "$purged" | sed 's/^/    /'
    echo
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "Pricing lint FAILED."
  exit 1
fi
echo "Pricing lint passed."
exit 0

#!/usr/bin/env python3
"""Generate the marketing value-prop sticker SVGs through Recraft.

Mirrors the iOS repo's Tier-2 pipeline (Foray/scripts/recraft/) and the locked
sticker spec in Foray/docs/04-design-system/onboarding-heroes.md:

  * model `recraftv4_1_pro_vector`, SVG output
  * flat three-colour ramp: ink #1C1C1E, white #FFFFFF, mid #8E8E93
  * one primary object + max two satellites, single bold stroke,
    thick pure-white sticker halo, zero texture/gradients

Run locally with your key (never committed):

    RECRAFT_API_KEY=... python3 scripts/recraft-web.py [--force] [asset ...]

Hand-authored fallbacks already ship in public/brand/ (vp-*.svg for the value
props, step-*.svg for the five-step promise row) — this script only *replaces*
them when the Recraft output actually meets the spec, per the design doc's own
guidance: inspect every result against the locked Groceries reference before
shipping.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

API_BASE = "https://external.api.recraft.ai/v1"
MODEL = "recraftv4_1_pro_vector"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "brand"

STICKER_SPEC = (
    "Flat vector sticker illustration in a locked brand style. Use exactly "
    "three colours and nothing else: ink #1C1C1E, pure white #FFFFFF, and mid "
    "grey #8E8E93. Every shape is wrapped in a thick pure-white sticker halo "
    "outline (like a die-cut sticker). One single bold stroke weight "
    "throughout, no thin lines, no multi-line hatching. Flat colour fills "
    "only: no gradients, no shadows, no texture, no sketch grain. Composition "
    "is one clear primary object plus at most two small satellite objects, "
    "generously padded and centred on a transparent background. Shapes are "
    "simple and geometric with large corner radii, as if built from SF Symbol "
    "silhouettes. No text or lettering anywhere."
)

ASSETS: dict[str, str] = {
    # --- Value-prop cards (large, ~160px display) --------------------------
    "vp-swipe": (
        "Primary object: an upright recipe swipe card tilted a few degrees "
        "clockwise, containing a rounded grey photo placeholder in its top "
        "half and two rounded text-line bars below the photo. A round ink-"
        "coloured badge containing a white heart is stamped overlapping the "
        "card's bottom-right corner, meaning this recipe was chosen. "
        "Satellite: one plain grey card tilted the opposite way peeking out "
        "from behind the left edge, meaning a recipe that was skipped. "
    ),
    "vp-trolley": (
        "Primary object: a wide shopping basket with a single curved carry "
        "handle arching over the top and three vertical grey slats on its "
        "body. Satellite: one round ink-coloured badge containing a bold "
        "white tick mark, stamped overlapping the basket's bottom-right "
        "corner, meaning the list is combined and complete. "
    ),
    "vp-clicks": (
        "Primary object: a bank payment card in landscape orientation with a "
        "horizontal grey magnetic stripe band across its upper third, a small "
        "rounded grey chip on the lower left, and two small curved "
        "contactless-payment arcs on the lower right. Satellite: one round "
        "ink-coloured badge containing a bold white tick mark stamped "
        "overlapping the card's bottom-right corner, meaning checkout is "
        "paid and done. "
    ),
    # --- Five-step promise row thumbnails (small, ~80px display) -----------
    "step-import": (
        "Primary object: a single rounded app tile containing two rounded "
        "grey text-line bars in its lower half, with a bold downward arrow "
        "dropping into the tile from above, meaning a recipe being imported "
        "and saved. No other objects. Very simple, reads clearly at small "
        "thumbnail size. "
    ),
    "step-swipe": (
        "Primary object: an upright recipe card tilted slightly clockwise "
        "with a rounded grey photo placeholder in its top half and a bold "
        "ink-coloured heart in its lower half, meaning swipe right to keep "
        "this recipe. Satellite: one plain grey card peeking out behind it, "
        "tilted the opposite way. Very simple, reads clearly at small "
        "thumbnail size. "
    ),
    "step-cart": (
        "Primary object: a shopping basket with a single curved carry handle "
        "and three vertical grey slats on its body. No satellites. Very "
        "simple, reads clearly at small thumbnail size. "
    ),
    "step-checkout": (
        "Primary object: a bank payment card in landscape orientation with a "
        "horizontal grey magnetic stripe band across its upper third, a "
        "small rounded grey chip on the lower left and one short grey "
        "number bar on the lower right. No satellites. Very simple, reads "
        "clearly at small thumbnail size. "
    ),
    "step-cook": (
        "Primary object: a classic puffy chef's hat (toque) with a rounded "
        "three-lobed top and a grey band at its base. No satellites. Very "
        "simple, reads clearly at small thumbnail size. "
    ),
}


def api_key() -> str:
    key = os.environ.get("RECRAFT_API_KEY") or os.environ.get("RECRAFT_API_TOKEN")
    if not key:
        sys.exit("Set RECRAFT_API_KEY (see Foray/docs/05-architecture/secrets-and-keys.md)")
    return key


def generate(name: str, brief: str, key: str) -> bytes:
    body = json.dumps(
        {
            "prompt": brief + STICKER_SPEC,
            "model": MODEL,
            "style": "vector_illustration",
            "size": "1024x1024",
            "controls": {"no_text": True, "artistic_level": 2},
        }
    ).encode()
    req = urllib.request.Request(
        f"{API_BASE}/images/generations",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        payload = json.load(resp)
    url = payload["data"][0]["url"]
    with urllib.request.urlopen(url) as image:
        return image.read()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("assets", nargs="*", default=list(ASSETS), help="asset names to generate")
    parser.add_argument("--force", action="store_true", help="overwrite existing SVGs")
    args = parser.parse_args()

    key = api_key()
    targets = args.assets or list(ASSETS)

    for name in targets:
        if name not in ASSETS:
            sys.exit(f"Unknown asset {name!r}; choose from {', '.join(ASSETS)}")
        out = OUT_DIR / f"{name}.svg"
        if out.exists() and not args.force:
            print(f"skip {out.name} (exists; use --force)")
            continue
        print(f"generating {name} …")
        out.write_bytes(generate(name, ASSETS[name], key))
        print(f"wrote {out}")

    print(
        "\nInspect each SVG against public/brand/onb-hero-groceries.svg "
        "(halo 56, rx 72, ramp #1C1C1E/#FFFFFF/#8E8E93). If Recraft missed the "
        "spec, keep the hand-authored fallback (git checkout the file)."
    )


if __name__ == "__main__":
    main()

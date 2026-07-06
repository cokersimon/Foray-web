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

Hand-authored fallbacks already ship in public/brand/ (vp-swipe.svg,
vp-trolley.svg, vp-clicks.svg) — this script only *replaces* them when the
Recraft output actually meets the spec, per the design doc's own guidance:
inspect every result against the locked Groceries reference before shipping.
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
    "Flat vector sticker illustration. Exactly three colours: ink #1C1C1E, "
    "pure white #FFFFFF, mid grey #8E8E93. Every shape has a thick pure-white "
    "sticker halo outline. Single bold stroke weight throughout. Flat fills "
    "only — no gradients, no texture, no sketch grain. One primary object plus "
    "at most two satellite objects, centred on a transparent background."
)

ASSETS: dict[str, str] = {
    "vp-swipe": (
        "A recipe swipe card with a rounded photo area and a bold heart below "
        "it, one plain card peeking out behind it. "
    ),
    "vp-trolley": (
        "A shopping basket with a curved handle and three vertical slats, one "
        "round tick-mark badge overlapping its corner. "
    ),
    "vp-clicks": (
        "A large rounded rectangular button containing a bold tick mark, one "
        "small tap ripple of two concentric circles beside it. "
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

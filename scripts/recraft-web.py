#!/usr/bin/env python3
"""Generate marketing illustration assets through Recraft.

Outcome cards on the homepage use photoreal / 3D object crops from
`public/brand/foray-kitchen-objects.png` today. This script is reserved for
future dedicated assets (isometric food objects + interaction stills) when a
Recraft key is available.

Historical sticker assets (vp-*, step-*) were retired from the marketing site
in favour of Apple-like punchy cards and product-phone screens.

Run locally with your key (never committed):

    RECRAFT_API_KEY=... python3 scripts/recraft-web.py [--force] [asset ...]
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

API_BASE = "https://external.api.recraft.ai/v1"
MODEL = "recraftv3"  # raster-capable; swap when generating dedicated outcome stills
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "brand"

# Future outcome / interaction stills — generate when ready to replace kitchen crops.
ASSETS: dict[str, str] = {
    "outcome-choose": (
        "Photorealistic editorial still, soft kitchen daylight, shallow depth of "
        "field. Hands holding a phone showing a recipe card above a wooden "
        "counter with fresh tomatoes and basil. Clean, premium, no text, no logos."
    ),
    "outcome-shop": (
        "Photorealistic editorial still of a tidy grocery basket with fresh "
        "produce and pantry items on a light counter. Soft daylight, premium "
        "food photography, no text, no logos, no people faces."
    ),
    "outcome-cook": (
        "Photorealistic editorial still of a phone propped beside a hob with a "
        "pan of tomato pasta simmering. Soft kitchen light, premium food "
        "photography, no text, no logos."
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
            "prompt": brief,
            "model": MODEL,
            "style": "realistic_image",
            "size": "1024x1024",
            "controls": {"no_text": True},
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
    parser.add_argument("--force", action="store_true", help="overwrite existing files")
    args = parser.parse_args()

    key = api_key()
    targets = args.assets or list(ASSETS)

    for name in targets:
        if name not in ASSETS:
            sys.exit(f"Unknown asset {name!r}; choose from {', '.join(ASSETS)}")
        out = OUT_DIR / f"{name}.png"
        if out.exists() and not args.force:
            print(f"skip {out.name} (exists; use --force)")
            continue
        print(f"generating {name} …")
        out.write_bytes(generate(name, ASSETS[name], key))
        print(f"wrote {out}")

    print(
        "\nInspect each PNG for consistency with foray-kitchen-objects.png "
        "(camera, lighting, materials). Wire into value-props.tsx when ready."
    )


if __name__ == "__main__":
    main()

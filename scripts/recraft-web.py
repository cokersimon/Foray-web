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

ASSETS: dict[str, str] = {
    # Hero background — leave clear centre for ProductPhone overlay.
    "foray-uk-groceries": (
        "Professional commercial food photography for a UK meal-planning app "
        "hero background. Soft top-down / slight 3/4 angle flat-lay on a clean "
        "light grey (#f5f5f7) matte surface, bright soft natural daylight, "
        "gentle realistic shadows, premium and uncluttered. CRITICAL: leave a "
        "large empty vertical clear centre column (about 35–40% of width) so a "
        "smartphone mockup can sit on top without covering food — arrange "
        "groceries only around left, right, top and bottom edges. UK "
        "supermarket grocery objects, photorealistic, no logos, no readable "
        "brand names, no text, no watermarks, no people, no phone in the image: "
        "left — clear plastic retail packet of dried penne pasta (UK own-brand "
        "style, plain cream label with no words); upper left — vine of bright "
        "red cherry tomatoes; lower left — two green apples and blueberries in "
        "a clear punnet; right — small glass olive oil bottle with cork or "
        "pour spout (no label text); upper right — wooden kitchen spoon and "
        "fresh basil; lower right — lemon half and small black ceramic ramekin. "
        "Fresh British weekly shop aesthetic, organised arrangement, landscape "
        "3:2 framing."
    ),
    # Feature cards — Apple Personal Setup–style thick rounded line-art collage.
    # One dominant stroke colour per card; white field; no photoreal; no text.
    # Silhouette-as-container cards: large themed outline with icons inside,
    # monochrome stroke, white field. Household=orange fruit, pantry=camera,
    # create=notepad, chef=apple.
    "feature-household": (
        "Minimalist monochrome line-art illustration on pure white. Single "
        "stroke colour vivid orange #ff9500 only. A LARGE ORANGE (citrus fruit) "
        "silhouette with a small leaf is the outer container — NOT an apple. "
        "Inside the orange, a grid of household cooking icons: people/family "
        "silhouettes, shopping cart, servings dial, grocery bags, buildings, "
        "bowls. Tiny orange fruit motifs may appear inside, never apples. "
        "Uniform thick outline, rounded caps, light stipple texture allowed, "
        "no photoreal, no text, no logos, square composition."
    ),
    "feature-pantry": (
        "Minimalist monochrome line-art illustration on pure white. Single "
        "stroke colour soft teal #30b0c7 only. A LARGE VINTAGE CAMERA "
        "silhouette is the outer container — classic rangefinder / old-style "
        "Canon look with body, lens barrel, viewfinder hump, and shutter "
        "button, NOT a fruit, NOT an apple, NOT a pear. Inside the camera "
        "body, a detailed pantry scene: shelves, jars, bottles, fridge, "
        "bowls, baskets of produce, checklist icons. Uniform thick outline, "
        "rounded caps, light stipple texture allowed, no photoreal, no text, "
        "no logos, square composition."
    ),
    "feature-create": (
        "Minimalist monochrome line-art illustration on pure white. Single "
        "stroke colour indigo #5856d6 only. A LARGE SPIRAL-BOUND NOTEPAD "
        "silhouette is the outer container — ring binders / spiral coils "
        "clearly along the TOP edge, rectangular paper page hanging down, "
        "NOT a fruit, NOT a lemon, NOT an apple. Inside the paper area, "
        "creative recipe icons arranged on the page: pencil, camera, photo, "
        "paintbrush, open book, recipe card, lightbulb, paper airplane. "
        "Uniform thick outline, rounded caps, light stipple texture allowed, "
        "no photoreal, no text, no logos, square composition."
    ),
    "feature-chef-siri": (
        "Minimalist monochrome line-art illustration on pure white. Single "
        "stroke colour system blue #007aff only. A LARGE APPLE silhouette with "
        "stem and leaf is the outer container. Inside: chef with headphones, "
        "whisk, mug, apple slice, berries, juicer. Keep apple motifs. Uniform "
        "thick outline, rounded caps, light stipple texture allowed, no "
        "photoreal, no text, no logos, square composition."
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

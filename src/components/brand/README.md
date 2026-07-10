# Foray design system (marketing)

Single source of truth for the public site. Prefer these tokens and
components everywhere so a future light/dark toggle only flips
`class="dark-theme"` on `<html>`.

## Colour & type

Defined as CSS variables in `src/app/globals.css`:

- Light: `:root`
- Dark: `.dark-theme` (ready; not toggled yet)

Use Tailwind token classes: `bg-background`, `text-foreground`,
`text-muted`, `bg-section-grey`, `bg-ink`, `text-brand-dot`, etc.

## Icons

Apple SF Symbols geometry via `SfSymbol` in
`src/components/brand/sf-symbol.tsx` (exported from SF Symbols.app).

| Usage | Symbol |
| --- | --- |
| Pricing checklist | `checkmarkSealFill` |
| How it works controls | `chevronLeft` / `chevronRight` — plain on mobile; `.glass-chip-clear` liquid-glass from `lg` up |
| FAQ accordion | `chevronDown` |
| Mobile menu | `line3Horizontal` / `xmark` |
| Hero chips | `clock` / `banknote` / `forkKnife` / `cart` |
| Product phone chrome | `heartFill`, `arrowRight`, `checkmark`, etc. |

Import from `@/components/brand` or `@/components/brand/sf-symbol`.

Social network marks in the footer stay as brand SVGs (not SF Symbols).

## CTAs

Official App Store badge: `AppStoreBadge` in
`src/components/marketing/app-store-badge.tsx`.
Black on light surfaces; white variant on the open mobile menu.

Apple Pay marketing mark: `ApplePayMark` in
`src/components/marketing/apple-pay-mark.tsx` (`public/brand/apple-pay-mark.png`).
Use only next to checkout / Apple Pay copy — never in the same tile as the
App Store badge. Do not recolour, animate, or restyle.

Glass chips/buttons: `.marketing-button` / `.glass-chip` (toolbar) /
`.glass-chip-clear` (floating over section-grey) in `globals.css`.

/**
 * Foray marketing design system — tokens & public API.
 *
 * Colour / type / radius live as CSS variables in `src/app/globals.css`
 * (`:root` light, `.dark-theme` dark). Components should prefer those
 * tokens (`bg-background`, `text-foreground`, `bg-section-grey`, etc.)
 * so a future theme toggle only flips the class on `<html>`.
 *
 * Icons are Apple SF Symbols geometry (see `sf-symbol.tsx`), exported for
 * promoting the Foray iOS app only.
 */

export { Wordmark } from "./wordmark";
export {
  SfSymbol,
  SF_SYMBOL_NAMES,
  SF_SYMBOL_SIZE,
  type SfSymbolName,
  type SfSymbolSize,
} from "./sf-symbol";

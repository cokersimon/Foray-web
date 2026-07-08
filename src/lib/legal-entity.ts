/**
 * Registered entity — mirror `docs/03-legal/company-profile.md` in the Foray repo.
 *
 * `registeredOffice` — Companies House (Hornton Place, AD01 filed 8 Jul 2026).
 * `dunsAddress` — Dun & Bradstreet / Apple Developer enrollment (Woodlands Gate).
 *
 * TEMP: all public website surfaces use `dunsAddress` until Apple's business
 * transfer is approved and D&B catches up. Then point `publicAddress` at
 * `registeredOffice` (one-line change below).
 */
export const LEGAL_ENTITY = {
  legalName: "Foray App Limited",
  companyNumber: "16501071",
  registeredOffice: {
    line1: "First Floor Office",
    line2: "3 Hornton Place",
    locality: "London",
    region: "England",
    postcode: "W8 4LZ",
    country: "United Kingdom",
  },
  dunsAddress: {
    line1: "Flat 14 Woodlands Gate",
    line2: "Woodlands Way",
    locality: "London",
    region: "England",
    postcode: "SW15 2SY",
    country: "United Kingdom",
  },
  effectiveDate: "7 July 2026",
  lastUpdated: "8 July 2026",
  privacyEmail: "privacy@forayapp.co.uk",
  legalEmail: "legal@forayapp.co.uk",
  supportEmail: "support@forayapp.co.uk",
} as const;

/** Flip to LEGAL_ENTITY.registeredOffice once D-U-N-S shows Hornton Place. */
const publicAddress = LEGAL_ENTITY.dunsAddress;

interface EntityAddress {
  line1: string;
  line2: string;
  locality: string;
  region: string;
  postcode: string;
  country: string;
}

function addressLine(
  address: EntityAddress,
  includeCountry = false,
): string {
  const { line1, line2, locality, region, postcode, country } = address;
  const base = `${line1}, ${line2}, ${locality}, ${region}, ${postcode}`;
  return includeCountry ? `${base}, ${country}` : base;
}

function addressBlock(address: EntityAddress): string[] {
  const { line1, line2, locality, region, postcode, country } = address;
  return [line1, line2, `${locality}, ${region} ${postcode}`, country];
}

export function registeredOfficeLine(includeCountry = false): string {
  return addressLine(publicAddress, includeCountry);
}

export function dunsAddressLine(includeCountry = false): string {
  return addressLine(publicAddress, includeCountry);
}

export function dataControllerLine(): string {
  return `${LEGAL_ENTITY.legalName}, a company registered in England and Wales (company number ${LEGAL_ENTITY.companyNumber}), registered office: ${registeredOfficeLine(true)}.`;
}

export function postalContactLine(): string {
  return `${LEGAL_ENTITY.legalName}, ${registeredOfficeLine(true)}.`;
}

export function dunsAddressBlock(): string[] {
  return addressBlock(publicAddress);
}

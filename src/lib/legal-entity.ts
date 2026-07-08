/**
 * Registered entity — mirror `docs/03-legal/company-profile.md` in the Foray repo.
 *
 * Two addresses, on purpose:
 * - `registeredOffice` — Companies House (legal / privacy / terms data controller).
 * - `dunsAddress` — Dun & Bradstreet record (Apple Developer business enrollment).
 *   D&B can lag an AD01 filing; the marketing site footer must match D-U-N-S,
 *   not whatever Companies House shows today.
 */
export const LEGAL_ENTITY = {
  legalName: "Foray App Limited",
  companyNumber: "16501071",
  /** Companies House registered office (AD01 filed 8 Jul 2026). */
  registeredOffice: {
    line1: "First Floor Office",
    line2: "3 Hornton Place",
    locality: "London",
    region: "England",
    postcode: "W8 4LZ",
    country: "United Kingdom",
  },
  /** D-U-N-S / Apple Developer business address (as on the D&B record). */
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
  return [`${line1}`, line2, `${locality}, ${region} ${postcode}`, country];
}

/** Single-line Companies House registered office (legal documents). */
export function registeredOfficeLine(includeCountry = false): string {
  return addressLine(LEGAL_ENTITY.registeredOffice, includeCountry);
}

/** Single-line D-U-N-S address (Apple business verification). */
export function dunsAddressLine(includeCountry = false): string {
  return addressLine(LEGAL_ENTITY.dunsAddress, includeCountry);
}

export function dataControllerLine(): string {
  return `${LEGAL_ENTITY.legalName}, a company registered in England and Wales (company number ${LEGAL_ENTITY.companyNumber}), registered office: ${registeredOfficeLine(true)}.`;
}

export function postalContactLine(): string {
  return `${LEGAL_ENTITY.legalName}, ${registeredOfficeLine(true)}.`;
}

/** Multi-line D-U-N-S block for the site footer — must match Apple enrollment. */
export function dunsAddressBlock(): string[] {
  return addressBlock(LEGAL_ENTITY.dunsAddress);
}

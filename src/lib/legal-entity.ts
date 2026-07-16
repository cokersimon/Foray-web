/**
 * Registered entity — mirror `docs/03-legal/company-profile.md` in the Foray repo.
 *
 * `registeredOffice` — Companies House (First Floor Office, 3 Hornton Place;
 * AD01 filed 8 Jul 2026). Used on all public website surfaces.
 * `dunsAddress` — Dun & Bradstreet / Apple Developer enrollment (Woodlands Gate);
 * kept for reference until those records catch up.
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
  // 16 Jul FINAL: equal-total dual billing (store-pricing JSON) + Chef AI dietary
  // personalisation disclosure (#chef-ai anchor). Price digits live in storePricing only.
  lastUpdated: "16 July 2026",
  privacyEmail: "privacy@forayapp.co.uk",
  legalEmail: "legal@forayapp.co.uk",
  supportEmail: "support@forayapp.co.uk",
} as const;

const publicAddress = LEGAL_ENTITY.registeredOffice;

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

export function registeredOfficeBlock(): string[] {
  return addressBlock(publicAddress);
}

export function dataControllerLine(): string {
  return `${LEGAL_ENTITY.legalName}, a company registered in England and Wales (company number ${LEGAL_ENTITY.companyNumber}), registered office: ${registeredOfficeLine(true)}.`;
}

export function postalContactLine(): string {
  return `${LEGAL_ENTITY.legalName}, ${registeredOfficeLine(true)}.`;
}

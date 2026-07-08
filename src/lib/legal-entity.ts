/**
 * Registered entity — mirror `docs/03-legal/company-profile.md` in the Foray repo.
 * Address fields match Companies House (AD01, 8 Jul 2026) and the D-U-N-S record
 * Apple uses for the individual → business account transfer.
 */
export const LEGAL_ENTITY = {
  legalName: "Foray App Limited",
  companyNumber: "16501071",
  /** Structured registered office — same breakdown as Companies House / D&B. */
  address: {
    line1: "First Floor Office",
    line2: "3 Hornton Place",
    locality: "London",
    region: "England",
    postcode: "W8 4LZ",
    country: "United Kingdom",
  },
  effectiveDate: "7 July 2026",
  lastUpdated: "8 July 2026",
  privacyEmail: "privacy@forayapp.co.uk",
  legalEmail: "legal@forayapp.co.uk",
  supportEmail: "support@forayapp.co.uk",
} as const;

/** Single-line registered office — matches Companies House and D-U-N-S. */
export function registeredOfficeLine(includeCountry = false): string {
  const { line1, line2, locality, region, postcode, country } =
    LEGAL_ENTITY.address;
  const base = `${line1}, ${line2}, ${locality}, ${region}, ${postcode}`;
  return includeCountry ? `${base}, ${country}` : base;
}

/** @deprecated Use `registeredOfficeLine()` — kept for call-site clarity. */
export const registeredOffice = registeredOfficeLine(false);

export function dataControllerLine(): string {
  return `${LEGAL_ENTITY.legalName}, a company registered in England and Wales (company number ${LEGAL_ENTITY.companyNumber}), registered office: ${registeredOfficeLine(true)}.`;
}

export function postalContactLine(): string {
  return `${LEGAL_ENTITY.legalName}, ${registeredOfficeLine(true)}.`;
}

/** Multi-line block for the site footer (Apple seller / D-U-N-S verification). */
export function registeredOfficeBlock(): string[] {
  const { line1, line2, locality, region, postcode, country } =
    LEGAL_ENTITY.address;
  return [
    `${line1}, ${line2}`,
    `${locality}, ${region} ${postcode}`,
    country,
  ];
}

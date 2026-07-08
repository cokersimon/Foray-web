/** Registered entity — mirror `docs/03-legal/company-profile.md` in the Foray repo. */
export const LEGAL_ENTITY = {
  legalName: "Foray App Limited",
  companyNumber: "16501071",
  registeredOffice:
    "First Floor Office, 3 Hornton Place, London, England, W8 4LZ, United Kingdom",
  effectiveDate: "7 July 2026",
  lastUpdated: "8 July 2026",
  privacyEmail: "privacy@forayapp.co.uk",
  legalEmail: "legal@forayapp.co.uk",
  supportEmail: "support@forayapp.co.uk",
} as const;

export function dataControllerLine(): string {
  return `${LEGAL_ENTITY.legalName}, a company registered in England and Wales (company number ${LEGAL_ENTITY.companyNumber}), registered office: ${LEGAL_ENTITY.registeredOffice}.`;
}

export function postalContactLine(): string {
  return `${LEGAL_ENTITY.legalName}, ${LEGAL_ENTITY.registeredOffice}.`;
}

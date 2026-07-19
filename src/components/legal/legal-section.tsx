export type LegalNavSection = {
  id: string;
  title: string;
};

/** Stable fragment id from a section title (e.g. "1. Who we are" → "1-who-we-are"). */
export function sectionIdFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function LegalSection({
  title,
  id,
  children,
}: {
  title: string;
  /** Optional fragment anchor so the app can deep-link a section (e.g. /privacy#chef-ai). */
  id?: string;
  children: React.ReactNode;
}) {
  const sectionId = id ?? sectionIdFromTitle(title);
  return (
    <section id={sectionId} className="scroll-mt-24 space-y-4">
      <h2 className="pt-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

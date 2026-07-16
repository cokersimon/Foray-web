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
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="pt-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

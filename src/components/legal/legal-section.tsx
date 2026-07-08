export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="pt-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

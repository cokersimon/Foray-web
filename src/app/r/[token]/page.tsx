import type { Metadata } from "next";
import { AppStoreBadge } from "@/components/marketing/app-store-badge";

/**
 * Recipe share landing page (ADR-022) — the no-app half of foray.app/r/{token}.
 * With Foray installed the universal link never reaches this page (the AASA in
 * public/.well-known routes /r/* into the app); without it, this renders the
 * shared recipe's title + hero and a "Get Foray" CTA.
 *
 * The snapshot is fetched server-side from the public rate-limited
 * `resolve-share` Edge Function so link previews (iMessage, WhatsApp) get real
 * Open Graph title + hero — not a generic card.
 */

// Every token is unique and shares can expire — always resolve per request.
export const dynamic = "force-dynamic";

const TOKEN_SHAPE = /^[a-f0-9]{32,64}$/;

type ResolvedShare = {
  recipeSnapshot?: { title?: string };
  heroUrl?: string | null;
};

async function resolveShare(token: string): Promise<ResolvedShare | null> {
  if (!TOKEN_SHAPE.test(token)) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  try {
    const resp = await fetch(
      `${base}/functions/v1/resolve-share?token=${token}`,
      { cache: "no-store" },
    );
    if (!resp.ok) return null;
    return (await resp.json()) as ResolvedShare;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const share = await resolveShare(token);
  const title = share?.recipeSnapshot?.title;
  return {
    title: title ? `${title} · Foray` : "Recipe · Foray",
      description: title
      ? `${title}: a recipe shared with you on Foray. Plan it, shop it, cook it.`
      : "A recipe shared with you on Foray. Swipe to fork.",
    robots: { index: false, follow: false },
    openGraph: {
      title: title ?? "A Foray recipe",
      description: "Open this recipe in Foray to plan it, shop it, and cook it.",
      siteName: "Foray",
      type: "article",
      ...(share?.heroUrl ? { images: [{ url: share.heroUrl }] } : {}),
    },
  };
}

export default async function SharedRecipePage({ params }: Props) {
  const { token } = await params;
  const share = await resolveShare(token);
  const title = share?.recipeSnapshot?.title;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_32px_var(--glow)]">
        {share?.heroUrl && (
          /* Hero lives in the public share bucket on Supabase — a remote,
             per-share image, so next/image optimization buys nothing here. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={share.heroUrl}
            alt={title ?? "Shared recipe"}
            className="aspect-[4/3] w-full bg-background object-cover"
          />
        )}
        <div className="px-6 pb-9 pt-7">
          <p className="mb-2.5 text-sm font-semibold uppercase tracking-widest text-brand-dot">
            Foray
          </p>
          {share ? (
            <>
              <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground">
                {title ?? "A Foray recipe"}
              </h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted">
                Someone shared this recipe with you. Open it in Foray to plan
                it, shop it, and cook it.
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground">
                Recipe not found
              </h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted">
                This share link has expired or doesn&apos;t exist. Ask your
                friend to share it again.
              </p>
            </>
          )}
          <div className="flex justify-center">
            <AppStoreBadge location="referral" />
          </div>
          <p className="mt-5 text-[13px] text-muted">Swipe to fork.</p>
        </div>
      </div>
    </main>
  );
}

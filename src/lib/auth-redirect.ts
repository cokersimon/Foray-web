import { SITE_URL } from "./site";

/**
 * Password-recovery emails must always redirect to the public site — never
 * `localhost`, or mobile Safari cannot open the link after leaving dev.
 *
 * Use the exact path (no query string) so Supabase redirect allow-list matching succeeds.
 */
export function passwordResetRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL;
  return `${base}/auth/reset-password`;
}

/** PKCE callback when the reset link arrives with a `?code=` query param. */
export function passwordResetCallbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL;
  return `${base}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
}

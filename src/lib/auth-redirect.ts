import { SITE_URL } from "./site";

/**
 * Password-recovery emails must always redirect to the public site — never
 * `localhost`, or mobile Safari cannot open the link after leaving dev.
 */
export function passwordResetCallbackUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL;
  return `${base}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
}

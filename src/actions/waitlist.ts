"use server";

import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Best-effort, per-instance rate limiting. This is an open server action, so
 * without it anyone can script signups against our Resend quota. A Map is fine
 * pre-launch: it resets per serverless instance, but blunts naive abuse.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 5;
const attemptsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attemptsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  recent.push(now);
  attemptsByIp.set(ip, recent);
  // Opportunistic prune so the map doesn't grow unbounded.
  if (attemptsByIp.size > 1000) {
    for (const [key, times] of attemptsByIp) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) attemptsByIp.delete(key);
    }
  }
  return recent.length > RATE_MAX_ATTEMPTS;
}

function buildWelcomeEmail(): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Foray</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding: 60px 24px;">
        <table role="presentation" style="max-width:520px; width:100%; margin:0 auto; text-align:center;">
          <tr>
            <td align="center">
              <p style="margin:0 0 24px; font-size:28px; font-weight:bold; letter-spacing:-0.02em; color:#000000; text-align:center;">Foray<span style="color:#FF9500;">.</span></p>
              <h1 style="margin:0 0 24px; font-size:24px; font-weight:bold; color:#000000; text-align:center;">You&rsquo;re on the list</h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#000000; text-align:center;">
                Thanks for joining the Foray waitlist. We&rsquo;re building the fastest way to turn a recipe you love into a sorted grocery list and a five-click checkout.
              </p>
              <p style="margin:0 0 32px; font-size:16px; line-height:1.6; color:#000000; text-align:center;">
                We&rsquo;ll email you the moment early access opens. Sit tight.
              </p>
              <hr style="border:none; border-top:1px solid #000000; margin:0 0 24px;" />
              <p style="margin:0; font-size:12px; color:#000000; text-align:center;">
                &copy; ${year} Foray. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export async function joinWaitlist(
  email: string,
  honeypot = "",
): Promise<{ success: boolean; error?: string }> {
  // Bots that autofill the hidden field get a silent "success" and no email.
  if (honeypot.trim() !== "") {
    return { success: true };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid e-mail address." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return {
      success: false,
      error: "Too many attempts. Please try again in a few minutes.",
    };
  }

  try {
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const { error: contactError } = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(audienceId ? { segments: [{ id: audienceId }] } : {}),
    });

    if (contactError) {
      const message = contactError.message?.toLowerCase() ?? "";
      // Repeat signup: already on the list — don't re-send the welcome email.
      if (message.includes("already exist") || contactError.statusCode === 409) {
        return { success: true };
      }
      // Contact save failed for another reason; log and still try the welcome
      // email so the signup isn't silently lost.
      console.error("Waitlist contact save failed (non-fatal):", contactError);
    }

    const { error: sendError } = await resend.emails.send({
      // NOTE: forayapp.co.uk must be a verified sending domain in Resend, or sends fail.
      from: "Foray <hello@forayapp.co.uk>",
      to: email,
      subject: "You're on the Foray waitlist",
      html: buildWelcomeEmail(),
    });

    if (sendError) {
      console.error("Waitlist welcome email failed:", sendError);
      return { success: false, error: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Waitlist signup error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

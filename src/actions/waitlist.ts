"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildWelcomeEmail(_email: string): string {
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
): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid e-mail address." };
  }

  console.log("Waitlist Triggered for:", email);

  try {
    await resend.contacts.create({
      email,
      firstName: "",
      lastName: "",
      unsubscribed: false,
    });
  } catch (contactErr: unknown) {
    console.error(
      "Waitlist global contact save failed (non-fatal); continuing to send e-mail:",
      contactErr,
    );
  }

  try {
    await resend.emails.send({
      // NOTE: forayapp.co.uk must be a verified sending domain in Resend, or sends fail.
      from: "Foray <hello@forayapp.co.uk>",
      to: email,
      subject: "You're on the Foray waitlist",
      html: buildWelcomeEmail(email),
    });

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    if (message.toLowerCase().includes("already exists")) {
      return { success: true };
    }

    console.error("Waitlist signup error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

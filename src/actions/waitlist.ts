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
  <title>Welcome to Zentra</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;color:#000000;font-family:sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding: 60px 24px;">
        <table role="presentation" style="max-width:520px; width:100%; margin:0 auto; text-align:center;">
          <tr>
            <td align="center">
              <h1 style="margin:0 0 24px; font-size:24px; font-weight:bold; color:#000000; text-align:center;">Welcome to Zentra</h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.6; color:#000000; text-align:center;">
                You&rsquo;re officially on the waitlist. We&rsquo;re building something special. AI-powered fitness, nutrition, and recovery that adapts to your life.
              </p>
              <p style="margin:0 0 32px; font-size:16px; line-height:1.6; color:#000000; text-align:center;">
                We&rsquo;ll reach out soon with early access. In the meantime, sit tight. Great things are coming.
              </p>
              <hr style="border:none; border-top:1px solid #000000; margin:0 0 24px;" />
              <p style="margin:0; font-size:12px; color:#000000; text-align:center;">
                &copy; ${year} Zentra. All rights reserved.
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
      from: "Zentra <hello@zentraapp.com>",
      to: email,
      subject: "Welcome to Zentra",
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

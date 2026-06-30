import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { passwordResetRedirectUrl } from "@/lib/auth-redirect";

/**
 * Server-side password recovery — always emails a link to forayapp.co.uk, even when
 * the request originates from localhost dev.
 */
export async function POST(request: Request) {
  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

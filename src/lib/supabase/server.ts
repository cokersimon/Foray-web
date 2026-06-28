import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server Supabase client — shares the auth cookie jar with the browser + middleware. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll throws in Server Components; route handlers can write cookies.
          }
        },
      },
    },
  );
}

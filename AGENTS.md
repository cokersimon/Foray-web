<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Backend: Supabase (NOT Convex)

This admin portal was ported from a Zentra/Orizon (Convex) base, but the runtime is now
**Supabase** — there is no live Convex deployment. Stale `convex`/`orizon` names may linger in
a few identifiers/comments; treat Supabase as the source of truth.

- All admin traffic goes through two Supabase Edge Functions (deployed from the Foray iOS repo's
  `supabase/functions/`): `chef-admin` (typed action router — `{ action, ...args }`) and
  `chef-ingest` (async ingest). Call them via `src/lib/chef-api.ts` / `useChefQuery`.
- Auth + data use `@supabase/ssr` (`src/lib/supabase/client.ts`); the project ref is in
  `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The consumer iOS
  app and this portal share ONE Supabase project (admin access is gated by an admin JWT;
  `chef` schema is service-role only). See ADR-019 + ADR-030.

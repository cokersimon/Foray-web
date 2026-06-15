# Foray Web

The Foray marketing site and hidden admin portal — a single [Next.js 16](https://nextjs.org) app.

- **Marketing** (`/`, `/terms`, `/privacy`): public-facing site for the Foray iOS app.
- **Admin** (`/admin`): role-gated cockpit (`app_metadata.role === 'admin'`) for the recipe pipeline, reports triage, checkout reconciliation, and read-only errors/analytics. All admin traffic flows through the Foray `chef-admin` / `chef-ingest` Supabase Edge Functions.

Backed by the Foray Supabase project (shared with the iOS app): the `chef` schema is the admin side, `public` is the consumer side.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin portal lives at `/admin` and redirects to `/sign-in` unless you are signed in as an admin.

## Environment

Copy the required secrets into `.env.local` (git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...        # marketing waitlist
RESEND_AUDIENCE_ID=...
```

Never expose the Supabase service-role key, Gemini, or Recraft keys client-side — admin actions are authorized server-side inside the Edge Functions.

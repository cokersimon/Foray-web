# Foray Web

The Foray marketing site and hidden admin portal — a single [Next.js 16](https://nextjs.org) app.

- **Marketing** (`/`, `/terms`, `/privacy`): public-facing site for the Foray iOS app.
- **Admin** (`/admin`): role-gated cockpit (`app_metadata.role === 'admin'`). `/admin` redirects to the Recipes queue; the sidebar is Recipes, AI ingest, Checkout, Reports, Errors, Analytics. All admin traffic flows through the Foray `chef-admin` / `chef-ingest` Supabase Edge Functions.

Backed by the Foray Supabase project (shared with the iOS app): the `chef` schema is the admin side, `public` is the consumer side.

## Recipe pipeline & global corpus

The admin Recipes queue is a status machine over `chef.staging_recipes`:

```
AI ingest ──▶ ready_for_review ──▶ approved ──▶ published
 (chef-ingest)     (Review tab)     (Approved)   (Published)
                                        ▲             │
                                        └── unpublish ◀┘
```

- **AI ingest** (source URL/text or batch generate) creates a staging row and kicks off the Recraft hero. Approve/Reject is gated on an approved hero image (ADR-034: ingredient lines are self-contained — no per-ingredient art, no `ingredientId`; a line carries `displayName` + `quantity` + `aisle`/`allergens`/`dietary`/`lineMacros`, ADR-040).
- **Publish** runs the async `publish` job (hero variants + `publish_recipe` TX) and writes the row into `public.recipes`. **Unpublish** returns it to Approved and hides it from the app.
- **Global corpus = `public.recipes` rows with `visibility = 'public'`.** Only published recipes are globally available.

> **Known gap (Phase 5, not yet built):** the iOS app's Catalog/Explore still renders the bundled `SampleCorpus` seeds (`source.type == .seed`), not `public.recipes`. Until the iOS discovery/sync layer reads `public.recipes`, publishing here will **not** surface a recipe in-app. As of this writing `public.recipes` has **0** public rows, which is why the admin Published tab is empty — nothing has been run through ingest → publish yet.

To inspect live state (needs the service-role key; the `chef` schema is not exposed to the anon/PostgREST role):

```sql
select status, count(*) from chef.staging_recipes group by status;
select visibility, count(*) from public.recipes group by visibility;
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin portal lives at `/admin` (which redirects to `/admin/recipes`) and bounces to `/sign-in` unless you are signed in as an admin.

## Environment

Copy the required secrets into `.env.local` (git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...        # marketing waitlist
RESEND_AUDIENCE_ID=...
```

Never expose the Supabase service-role key, Gemini, or Recraft keys client-side — admin actions are authorized server-side inside the Edge Functions.

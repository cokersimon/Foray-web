<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Convex (shared Orizon deployments)

- `convex/schema.ts` only declares tables this repo owns (`admin_ingestion_defaults`, `ai_configs`, `staging_recipes`). Other tables (for example `users`) exist in the deployment but are accessed at runtime via `convex/lib/usersRuntime.ts` so this schema does not reconcile or slim them.
- Push functions to a deployment with `npm run convex:push:dev` or `npm run convex:push:prod` (sets `CONVEX_DEPLOYMENT` for that run). `npx convex deploy --deployment-name` is not a valid flag on this CLI.
- Pushing against prod may rewrite `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` in `.env.local`. Point them back at dev for local Next.js against the dev Convex project.

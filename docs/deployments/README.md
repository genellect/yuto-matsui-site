# Delivery and cutover

Cloudflare Pages project: `yuto-matsui-site`, Git repository: `genellect/yuto-matsui-site`, production branch: `main`, output: `out`.

`npm run build` exports the site and adds `X-Portfolio-Commit` to static responses. The value comes from `CF_PAGES_COMMIT_SHA` on Pages and `git rev-parse HEAD` locally. This lets deployment verification distinguish the new release from a still-cached previous release without loading analytics.

The `Production verification` workflow runs after a push to main and can also be run manually. It waits for that exact commit, checks both language pages and static assets, then checks the HTTP contract. Its target is repository variable `PRODUCTION_ORIGIN`, now `https://yuto-matsui.com` after cutover. It performs GET/HEAD requests only. GA4 and form submissions are not involved. The workflow stores its HTTP evidence as a 30-day artifact.

Expected release path: PR → CI `verify` → merge to main → Cloudflare Git build → commit-matched production verification. Pages now has automatic main deployments enabled and its temporary main-rejection command was replaced with `npm run typecheck && npm run build && npm run verify` for this path to work. The migration's actual activation and verification are recorded separately.

## Compatibility during domain migration

Three existing Cloudflare URL Rewrite Rules target `/founder/`, `/founder-robots.txt`, and `/founder-sitemap.xml`. The new canonical static paths are `/`, `/robots.txt`, and `/sitemap.xml`.

The final build copies byte-identical canonical outputs to those three former paths and applies the same path-specific headers. This keeps the new deployment compatible while the existing rewrite rules are being retired, rather than requiring domain/DNS and three independent rule changes to complete atomically. It does not add a Next route or change the rendered UI. Canonical metadata and the external Founder redirect remain unchanged.

These three compatibility outputs can be removed in a later change after the old rewrite rules and the rollback requirement are retired. `scripts/verify-build.mjs` verifies that they match the canonical output.

## Recovery references

The pre-cutover deployment and routing inventory is in `2026-11-15-before.json`. The old COMPASS deployment and source remain available during migration. A custom-domain rollback restores the old Pages association/DNS and the previous URL Rewrite Rules; it is not the same as reverting a commit in the new repository. A new-site code rollback uses a previous successful production deployment, followed by the same HTTP and browser verification.

Actual production migration: [2026-11-15 cutover record](2026-11-15-cutover.md).

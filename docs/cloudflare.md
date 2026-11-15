# Cloudflare Workers preparation and compatibility gate

## Official pathway checked on 2026-11-15

Cloudflare's current guide recommends **vinext** as its default Next.js-on-Workers
path. It describes vinext as a beta Vite-based reimplementation of Next.js APIs,
not merely a deployment adapter for the existing compiler.

The guide still documents OpenNext as an alternative. However, the current
`@opennextjs/cloudflare` 1.20.17 package declares Next.js peer support
`>=15.5.29 <16 || >=16.4.5`. This application's pinned Next.js **16.4.2 does not
satisfy that range**. Do not suppress peer checks or silently install an older
adapter to bypass a support/security floor.

Sources:

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/cf/agents/
- https://opennext.js.org/cloudflare

**Current status:** standard Next.js build remains intact. No framework migration,
adapter installation, Worker deployment or account changes have been performed.
This source is not yet verified Workers-ready. A runtime migration/compatible
version decision and its verification remain release gates; the approved
animations must not be altered to work around platform differences.

An additional concrete runtime gate is the hardened PDF validator: it uses
terminable **Node worker threads**, which cannot be assumed available as
spawnable threads on Workers. Keep intake closed on Workers until an equivalent
isolated/bounded validation facility is implemented and tested. Do not silently
fall back to parsing attacker-controlled PDFs on the request thread.

### Task 64: confirmed runtime boundary

Cloudflare's current [Node API compatibility table](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
and [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)
classify `node:worker_threads` as a **nonfunctional stub**. Import success with
`nodejs_compat` does not provide `new Worker()`, termination or the resource
limits used by `src/lib/pathway/files.ts`. The current Node backend cannot run
unchanged on Workers; changing Next.js adapters does not solve that boundary.

Hosting requires a separately approved architecture:

1. Run the application on a supported Node server/container that supports worker
   threads and ships `scripts/pdf-validation-worker.mjs` plus `pdf-lib`. Cloudflare
   may front that origin, but this is not Workers execution. Use the request-IP
   trust mode appropriate to the actual authenticated ingress; do not accept
   spoofable `CF-Connecting-IP` headers at a publicly reachable Node origin.
2. If the application must execute on Workers, move PDF validation to an
   authenticated, independently resource-bounded Node/container service. Preserve
   lexical and structural checks, file/page/count/body limits, timeout and
   termination guarantees. Bind the verdict to the exact file digest; authenticate
   both directions, protect CV confidentiality, bound concurrency and fail closed
   on timeout, missing/invalid verdict or service outage. Never substitute a
   promise timeout around synchronous request-thread parsing.

Neither option has been selected or implemented. A compatible patched Next.js/
adapter decision (or separately tested beta vinext migration) is also still
required for Workers. Keep the existing runtime and security checks intact while
preparing a dedicated development Supabase project; Node production build success
is not Workers certification.

## Non-deploying compatibility checks

From the independent source directory:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm view @opennextjs/cloudflare version peerDependencies --json
pnpm dlx vinext check
```

The final command is the official non-destructive compatibility checker; review
the pinned package/reported compatibility before using it. It has not been
represented as a successful local runtime test by this implementation.

For the current recommended vinext pathway, perform the officially documented
side-by-side initialization and then verify its generated commands:

```sh
pnpm dlx vinext init
pnpm run dev:vinext
pnpm run build:vinext
```

Initialization changes dependencies/configuration and may prompt for a target.
Review those changes as a separate compatibility step rather than treating this
document as evidence they already exist. Keep the existing `next dev` and build
working during migration. Do not run the generated deployment command until the
owner separately authorizes live deployment.

If keeping native Next.js compilation with OpenNext, first move to a currently
supported compatible Next.js patch release and verify the complete website and
backend. Follow the current adapter guide and generated configuration, not a
stale guessed config. The project must never become a static export: submission,
Auth and review endpoints require a server runtime.

## Staging and production configuration

- Use independent Workers/environments and independent Supabase development/
  production projects. Never point preview branches at live applicant data.
- Configure every server-side environment variable from `backend-setup.md`
  through the relevant environment's secret store. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  is public/build-time; all privileged Supabase, HMAC, maintenance and SMTP
  credentials must stay server-side. Configure SMTP directly in Supabase.
- Set `SITE_URL` to each environment's exact HTTPS origin and
  `APPLICATION_TRUSTED_PROXY=cloudflare` only on an actual Workers deployment.
  The server then uses Cloudflare's `CF-Connecting-IP`, not arbitrary forwarded
  headers. Do not expose an alternate untrusted Node origin with this setting.
- Ensure Node API compatibility for `node:crypto`, `node:net` and the official
  Supabase client in the selected adapter/runtime configuration.
- Confirm upload/body limits, request duration, PDF-parser CPU/memory and
  concurrent request behavior on Workers. Test the maximum allowed files;
  do not assume a successful Node build proves Workers compatibility.
- Never cache `/admin`, `/api/admin/*`, `/api/pathway/*` or submission responses
  in CDN rules, service workers or an adapter cache. Preserve private/no-store
  response headers and cookies. Disable request-body/cookie/authorization logging
  and redact signed download URLs in observability systems.

## Domains, HTTPS and headers

After deployment approval, configure an owned domain as a Workers custom domain,
verify its DNS/routing and edge certificate, and redirect HTTP to HTTPS. Update
Supabase Site URL, permitted Auth URLs, the Turnstile hostname allowlist and email
logo URL. Do not use an unowned placeholder or enable indexing prematurely.

`next.config.ts` already supplies framing, nosniff, referrer, permissions and CSP
headers. The CSP permits inline hydration/styles for the approved application;
it is not a strict nonce-based policy. Verify the selected adapter preserves
those headers. Its existing one-year HSTS policy includes subdomains: confirm
every affected hostname supports HTTPS before enabling that policy on a real
domain. Secure cookies require production HTTPS.

Configure an authorized scheduled job for the maintenance endpoint and alerts
for cleanup failures. Do not put its bearer credential in a public CI variable,
URL, log or source file.

## Deployment and acceptance

Use the commands generated by the verified official pathway (vinext currently
documents `pnpm dlx @vinext/cloudflare deploy`). That is an external publication
operation and has **not been run or authorized by source preparation**.

Before deployment, require both-pathway synthetic acceptance tests, sender
authentication, forbidden anonymous/authenticated record operations, short-lived
CV access, failed upload/commit recovery, duplicate/racing submissions, mobile
form verification, security-header checks and a fresh secret scan of all browser
assets. Keep intake closed and use staging until these gates pass.

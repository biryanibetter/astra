# Astra Youth Innovation Network

Next.js application for Astra's public website and application forms.

## Local development

Requires Node.js 22 or newer and pnpm 11.5.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The build scripts prepare the locally served
MapLibre worker from the installed package; keep `scripts/prepare-maplibre.mjs`.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
pnpm exec playwright install chromium
pnpm test:e2e
```

Do not commit dependencies, build output, screenshots, recordings, environment
credentials, real application records or CVs.

## Current application status

Core and Fellow are five-step frontend forms. In this source snapshot they do
not submit applications; the final action is unavailable. Do not describe them
as a working live intake.

A separate school-interest intake has a server endpoint and an existing Supabase
migration. It remains closed without complete configuration and explicit
privacy/intake approval. Its existing production host check is Vercel-specific;
Cloudflare backend compatibility is not implemented in this initial snapshot.

Planned follow-on work includes private Core/Fellow persistence, verified-email
duplicate checks using Supabase Auth, Astra-branded verification email delivered
through Resend, private CV storage and an authorized review dashboard.

## Service configuration

`.env.example` lists variable names only. Supply real values in a local
`.env.local` file or your hosting provider's server-side secret configuration.
Never put service-role or other secret keys in `NEXT_PUBLIC_*` variables.

Use a separate development Supabase project and synthetic applicants for testing.
Review migrations under `supabase/migrations` before applying them. The initial
membership migration enables RLS and removes anonymous/authenticated table access;
it does not provision Core/Fellow storage or an administrator dashboard.

The existing school intake requires a canonical `SITE_URL`, a verified
`CONTACT_EMAIL`, server-only Supabase credentials, Turnstile configuration and a
cryptographically random `APPLICATION_IP_SALT` of at least 32 characters.
`APPLICATIONS_OPEN` and `PRIVACY_REVIEWED` must remain disabled until the
organization approves intake and its privacy/safeguarding procedures. Configure
an approved retention period; verify cleanup and backups before accepting data.

## Public assets and permissions

The school directory describes public school locations, not confirmed Astra
affiliations. Conceptual stock imagery does not depict Astra members or events.
Asset source notes and licenses are retained beside the relevant assets; the
Gravity Stars attribution is in `docs/licenses/gravity-stars-MIT.txt`.

Legacy reference images with unconfirmed redistribution rights are excluded.
The live page already uses the licensed photographs in `public/images/program-stock`;
its displayed imagery and animations are unchanged.

No repository-wide license is asserted for third-party assets.

## Deployment

Do not use static export for an application requiring server submission routes.
Cloudflare Workers/OpenNext configuration and live integration verification are
follow-on work, not completed deployment capabilities of this initial snapshot.
Publishing source does not deploy the website or open intake.

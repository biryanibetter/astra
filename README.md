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

Core and Fellow retain their original five-step local forms, including validation,
portfolio/CV controls and Review & Finish editing. Completion stays on the review
step and does not send data, verify email or claim receipt. Prepared backend code
includes verified-email duplicate checks, private PDF CV handling and
an authorized review dashboard at `/admin`. Intake fails closed without complete
configuration, an active round, and explicit CAPTCHA/privacy/intake approval.

The source includes additive Supabase migrations and an Astra-branded email
template for Supabase Auth with Resend custom SMTP. External services are **not
configured or certified live**. Follow [backend setup](docs/backend-setup.md) and
test a separate development project before enabling applications.

The integrated frontend retains its single Motion runtime, shared root
scroll-reveal ownership, native shimmer timeline and rendering/lifecycle fixes
with this backend. The approved logo, fixed navigation, Gravity Stars, Lenis,
application design and licensed program-image alternatives are retained.
Styled question cards keep their native keyboard controls and full-card
pointer/touch target. OTP controls and configuration notices are not mounted in
the local forms. Draft answers remain in page memory only. Connecting the prepared
backend to the frontend requires a separate, approved Supabase integration.

A separate school-interest endpoint and its existing migration are retained.
Its production host check remains Vercel-specific; do not enable that legacy
intake on a different host without a reviewed trusted-proxy adaptation.

## Service configuration

`.env.example` lists variable names only. Supply real values in a local
`.env.local` file or your hosting provider's server-side secret configuration.
Never put service-role or other secret keys in `NEXT_PUBLIC_*` variables.

Use a separate development Supabase project and synthetic applicants for testing.
Review migrations under `supabase/migrations` before applying them. The initial
membership migration enables RLS and removes anonymous/authenticated table access;
it is followed by the new pathway migration for Core/Fellow and private storage.

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
See [Cloudflare compatibility and deployment gates](docs/cloudflare.md). Current
official guidance changed to vinext, and the latest OpenNext adapter does not
support the currently pinned Next.js patch. No runtime migration or live
deployment is claimed. Publishing source does not deploy the site or open intake.

## Public repository release

This is an independent source snapshot, not a copy of the private development
history. Private instructions, build artifacts, credentials, browser recordings,
real applicant records and CVs are excluded. Automated secret scans do not prove
absolute absence of secrets.

Public push is blocked by unconfirmed redistribution permissions for
`public/media/astra-reel{,-loop,-poster,-still}.*` and
`public/videos/video.mp4`, and unconfirmed reuse terms for
`src/data/qatar-schools.json` (see `qatar-schools-manifest.json`, `rights`).
These files are already present in the independent repository's initial commit;
deleting them from the latest tree would not exclude them from a public push.
Publication requires confirmed rights or an explicitly approved history-clean
export excluding them. The existing history and local assets are preserved.

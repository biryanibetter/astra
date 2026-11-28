# ASTRA local route audit

Scope: the local Next.js app, redirect configuration, public navigation and sitemap, application callers, and the website-only Cloudflare worker. “Linked” means a current site link or discovery reference; API rows identify code callers separately.

## Public pages and applications

| Page | URL | Purpose | Linked? | Outdated or duplicated? | Necessary? / Recommended action |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | Introduces Astra, Experiences, founding members, school selection, and application pathways. | Yes — header, menu, footer, sitemap. | Current. | Yes — retain. |
| The Idea | `/the-idea` | Explains Astra and its areas of interest. | Yes — menu, footer, school profiles, sitemap. | Current; supersedes the old Programs landing page. | Yes — retain. |
| Experiences | `/#events` | Shows the kinds of experiences Astra aims to create. | Yes — menu and footer as What’s Next; both legacy event URLs. | Current homepage section. | Yes — retain. |
| Get Involved | `/#schools-heading` | School selection and entry into Core and Fellow applications. | Yes — menu, footer, About, Network and Contact; `/join` redirects here. | Current homepage section. | Yes — retain. |
| About Astra | `/about` | Organization introduction, student-led mission, and safeguarding commitments. | Sitemap only. | Mission overlaps Home and The Idea; safeguarding copy is distinct. | Standalone page optional — consolidate into The Idea and redirect only after preserving safeguarding copy in an approved location. |
| The Network | `/network` | Explains cross-school participation and Astra’s pathways. | Sitemap only. | Overlaps The Idea and Get Involved. Older pathway labels were updated in this cleanup. | Standalone page optional — redirect to `/#schools-heading` after approval. |
| Schools directory | `/schools` | Lists five schools and links to profiles; listings do not imply affiliation. | Linked from individual profiles. No main menu, footer or sitemap link. | Overlaps homepage school discovery, but uses a separate five-school data set and profile flow. | Not required by Core/Fellow — consolidate with homepage discovery only if the profile and chapter-intake decisions are approved first. |
| Individual school profiles | `/schools/[slug]` | School details, sources, chapter status, and legacy intake links. | Linked from the directory and corresponding school-interest forms. | Distinct sourced profiles; chapter intake is separate from Core/Fellow. | Conditional — retain pending a decision on the directory and chapter intake. |
| School interest / founding team | `/schools/[slug]/apply` | Express interest or help start a chapter (`?intent=interest` or `?intent=founding`). | Two links on each school profile; no main navigation link. | Legacy intake; it collects chapter interest, a different purpose from the current applications. | Conditional — retain until the organization decides whether to keep the chapter intake. |
| Contact | `/contact` | Verified contact for collaboration, safeguarding, and requests about application data; displays a setup notice if unavailable. | Linked from Privacy; listed in sitemap. | Distinct purpose. | Yes — retain. |
| Privacy notice | `/privacy` | Draft school-interest privacy notice, map disclosure, safeguards, and data-request process. | Linked from school-interest forms; listed in sitemap despite `noindex`. | Draft and scoped to legacy school intake; not an approved notice for future live Core/Fellow intake. | Yes — retain the route and approve notice coverage separately before enabling intake. |
| Astra Core application | `/apply/core` | Current Core application, optionally prefilled with the chosen school. | Yes — homepage Get Involved. | Current local form; live submission is not enabled in the local frontend. | Yes — retain. |
| Astra Fellow application | `/apply/fellow` | Current Fellow application, optionally prefilled with the chosen school. | Yes — homepage Get Involved. | Current local form; live submission is not enabled in the local frontend. | Yes — retain. |
| Retired receipt | `/apply/received` | Returns 404; only the submission flow can confirm a receipt. | No. | Retired safeguard; no receipt page renders. | Retain explicit 404; removing the stub is optional after verifying the invalid-track fallback still rejects it. |
| Old join route | `/join` | Compatibility redirect to `/#schools-heading`. | No current page links; Contact now links directly. | Redirect only. | Retain for old bookmarks. |
| Old programs route | `/programs` | Compatibility redirect to `/the-idea`. | No current page links; school profiles now link directly. | Redirect only. | Retain for old bookmarks. |
| Old What’s Next route | `/whats-next` | Compatibility redirect to `/#events`. | No links to the old URL. | Obsolete roadmap, proposed Launch Night, and repeated experience cards removed. | Redirect directly; implemented. |
| Old Events route | `/events` | Compatibility redirect to `/#events`. | No links to the old URL; removed from sitemap. | Redirect only. | Redirect directly; implemented. |
| Multistep form demo | `/multistep-form-preview` | Former form demonstration. | No. | Already removed; returns 404. | Keep removed. |
| Sterling navigation demo | `/sterling-preview` | Former menu demonstration. | No. | Already removed; returns 404. | Keep removed. |

The five profile slugs are `birla-public-school`, `doha-college`, `qatar-academy-doha`, `american-school-of-doha`, and `dps-modern-indian-school`. Each has a corresponding school-interest route. Invalid school slugs, unknown pathways, and unregistered paths such as `/apply` return 404.

## Administration, application APIs, and site infrastructure

| Route | URL | Purpose | Linked or called? | Outdated or duplicated? | Necessary? / Recommended action |
| --- | --- | --- | --- | --- | --- |
| Application review dashboard | `/admin` | Restricted review access. | Not publicly linked; reached after admin login. | Distinct. | Yes — retain. |
| Administrator sign-in | `/admin/login` | Starts an administrator session. | Not publicly linked; dashboard redirects unauthenticated visitors here. | Distinct. | Yes — retain. |
| Administrator sessions | `/api/admin/session` | Creates or ends admin sessions. | Called by admin UI. | Distinct. | Yes — retain. |
| Administrator application records | `/api/admin/applications` | Authorized review, export, updates, and removal of records. | Called by dashboard and its export/download actions. | Distinct. | Yes — retain. |
| Administrator maintenance | `/api/admin/maintenance` | Authorized retention maintenance. | Called by dashboard. | Distinct. | Yes — retain. |
| School-interest submission | `/api/applications` | Handles the legacy school-interest form when configured and enabled. | Called by school-interest UI. | Older intake; separate data and safeguards. | Conditional — retain while the associated route and data obligations remain. |
| Core/Fellow submission | `/api/pathway-applications` | Prepared, gated Core/Fellow intake. | No call from current local forms; prepared server endpoint. | Distinct. | Yes for the prepared intake — retain. |
| Application email verification | `/api/pathway/email` | Sends or verifies application email codes when configured. | Called by prepared email-check UI, which is not mounted in local forms. | Distinct. | Yes for the prepared intake — retain. |
| Application eligibility | `/api/pathway/eligibility` | Checks verified-email eligibility for the active intake round and pathway. | Called by the same prepared email-check UI. | Distinct. | Yes for the prepared intake — retain. |
| Sitemap | `/sitemap.xml` | Lists public discovery URLs. | Referenced by `robots.txt`. | The Idea now appears; Events was removed. | Yes — retain; reconcile entries with future consolidation decisions. |
| Crawler rules | `/robots.txt` | Blocks crawling locally by default; controls crawler access when `SITE_LIVE` is enabled. | Discovered at its standard URL. | Distinct. | Yes — retain. |
| Social share image | `/opengraph-image` | Generates Astra’s Open Graph image. | Referenced by page metadata. | Distinct. | Yes — retain. |
| Site icon | `/icon.png` | Astra browser icon. | Referenced by generated page metadata. | Distinct. | Yes — retain. |
| Not-found response | Any unmatched URL | Serves the site’s 404 page and provides a link home. | Reached through invalid or retired URLs. | Distinct. | Yes — retain. |
| Framework assets and image service | `/_next/static/*`, `/_next/image` | Delivers generated site bundles and optimized images. | Used by the framework and rendered pages. | Distinct. | Yes — retain. |

The Cloudflare worker blocks API requests and writes for the website-only release. The audit did not enable intake, sign in to administration, or invoke write endpoints. No other standalone development, demonstration, or duplicate landing pages were found.

## Decisions awaiting approval

1. **About:** consolidate into The Idea after deciding where to preserve its safeguarding commitments.
2. **Network:** retire the standalone overview and redirect to Get Involved.
3. **Schools:** decide together whether to keep the directory, sourced profiles, and chapter-interest workflow. The homepage map and Core/Fellow applications already use a separate school-selection flow.

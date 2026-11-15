import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveals } from "@/components/scroll-reveals";
export const metadata: Metadata = {
  title: "Privacy Notice",
  robots: { index: false, follow: false },
};
export default function Privacy() {
  return (
    <main id="main" className="content-page wrap" data-reveal-group="">
      <ScrollReveals />
      <p className="eyebrow" data-reveal="fade-up">
        Privacy & safeguarding
      </p>
      <h1 className="display" data-reveal="section">
        Your information.
        <br />
        Handled with care.
      </h1>
      <div className="notice" data-reveal="section">
        <p>
          <strong>Development draft, not an approved legal notice.</strong> Live
          applications remain closed until the responsible organization has
          reviewed local privacy and safeguarding requirements and approved this
          notice. Do not enable submissions based on this draft alone.
        </p>
      </div>
      <h2 data-reveal="fade-up">What the application asks for</h2>
      <p data-reveal="section">
        Your name, email, school, grade or academic year, confirmation that you
        are aged 13–18, areas of interest, membership interest, an optional
        introduction and your acknowledgement of this notice. Do not include
        sensitive information in your introduction. School founding-team
        applications also ask about an initiative or experience and why you want
        to contribute; these answers are stored privately with your application,
        not in the public school directory. We do not request your date of
        birth, address, phone number or identification documents.
      </p>
      <h2 data-reveal="fade-up">Why and who can access it</h2>
      <p data-reveal="section">
        The information is used to review and respond to membership
        applications. Access is restricted to authorized application reviewers.
        An application does not guarantee membership. The database is hosted by
        Supabase; Cloudflare Turnstile helps protect the form against automated
        abuse. No applicant details are displayed publicly.
      </p>
      <p data-reveal="section">
        The school map loads geography from OpenFreeMap. Loading the map sends
        that provider normal network information, including your IP address and
        requested map area, but not your application answers. School listings
        and map pins describe schools, not individual students or confirmed
        Astra affiliations.
      </p>
      <h2 data-reveal="fade-up">Security and retention</h2>
      <p data-reveal="section">
        Applications have restricted database access. A salted, non-public hash
        of a request address is used for abuse prevention, not a public profile.
        The default application retention period is 90 days from submission,
        configurable before launch. Expired application records must be purged
        by the operator&apos;s scheduled retention job; backups follow the
        hosting provider&apos;s separate policy.
      </p>
      <h2 data-reveal="fade-up">Your choices and deletion</h2>
      <p data-reveal="section">
        You may request access, correction, withdrawal or deletion through the
        verified{" "}
        <Link className="text-link" href="/contact">
          contact channel
        </Link>
        . The team must verify ownership of the application email before
        disclosing or deleting information. Do not send identification
        documents. Retention exceptions, response times and lawful grounds must
        be confirmed before launch.
      </p>
      <h2 data-reveal="fade-up">Students and guardian permission</h2>
      <p data-reveal="section">
        The network serves students aged 13–18. Applying is not permission to
        participate in activities. Appropriate guardian authorization and
        safeguarding review must happen separately before participation where
        required. This form does not request guardian contact details or grant
        photo-publication permission.
      </p>
      <h2 data-reveal="fade-up">Required before launch</h2>
      <p data-reveal="section">
        Confirm and publish the data controller&apos;s identity and verified
        contact, applicable legal grounds and guardian requirements, processor
        locations and international-transfer arrangements, final retention and
        backup policy, rights and complaint procedures, adult safeguarding lead
        and incident response process. The current draft is version
        2026-10-draft.
      </p>
    </main>
  );
}

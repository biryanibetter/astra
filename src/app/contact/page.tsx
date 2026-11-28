import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Contact" };
export default function Contact() {
  const email = process.env.CONTACT_EMAIL;
  const verifiedEmail =
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  return (
    <main id="main" className="content-page wrap" data-reveal-group="">
      <p className="eyebrow" data-reveal="fade-up">
        Start a conversation
      </p>
      <h1 className="display" data-reveal="section">
        Let&apos;s connect.
      </h1>
      <p data-reveal="section">
        For school representation, collaboration, safeguarding questions or
        application-data requests, contact the ASTRA team through its verified
        channel.
      </p>
      {verifiedEmail ? (
        <a
          className="button"
          href={`mailto:${verifiedEmail}`}
          data-reveal="cta"
        >
          Email Astra
        </a>
      ) : (
        <div className="notice" data-reveal="section">
          <p>
            A verified contact address has not been configured yet. This
            development website is not accepting contact messages or
            data-deletion requests. Do not send personal information through
            unverified channels.
          </p>
        </div>
      )}
      <p style={{ marginTop: 32 }} data-reveal="cta">
        Interested in the network?{" "}
        <Link className="text-link" href="/#schools-heading">
          Explore the application
        </Link>
        .
      </p>
    </main>
  );
}

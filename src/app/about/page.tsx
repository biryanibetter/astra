import type { Metadata } from "next";
import { ScrollReveals } from "@/components/scroll-reveals";
import { JoinLink } from "@/components/site";
export const metadata: Metadata = { title: "About Astra" };
export default function About() {
  return (
    <main id="main" className="content-page wrap" data-reveal-group="">
      <ScrollReveals />
      <p className="eyebrow" data-reveal="fade-up">
        Introducing Astra
      </p>
      <h1 className="display" data-reveal="section">
        Built by students.
        <br />
        Built for what&apos;s next.
      </h1>
      <p data-reveal="fade-up">
        Good ideas do not belong to one classroom. ASTRA Youth Innovation
        Network connects ambitious, curious students across schools in Qatar, so
        they can find collaborators, explore their interests and build things
        together.
      </p>
      <h2 data-reveal="fade-up">Student-led, with purpose.</h2>
      <p data-reveal="section">
        Our direction is simple: make it easier for young people to connect,
        learn and turn ideas into projects. Curiosity matters more than a
        polished CV.
      </p>
      <h2 data-reveal="fade-up">Safeguarding comes first.</h2>
      <p data-reveal="section">
        ASTRA serves students aged 13–18. Adult oversight, participation
        procedures and guardian authorization requirements must be reviewed and
        confirmed before participation begins. Applicant information and
        photographs are never published by this website.
      </p>
      <JoinLink reveal />
    </main>
  );
}

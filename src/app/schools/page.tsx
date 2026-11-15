import type { Metadata } from "next";
import Link from "next/link";
import { SCHOOLS } from "@/lib/schools";
import "@/components/schools/school-pages.css";
export const metadata: Metadata = {
  title: "Schools",
  description: "Explore school listings in the ASTRA network directory.",
};
const status = {
  unconfirmed: "Chapter status unconfirmed",
  interest: "Interest expressed",
  founding: "Chapter forming",
  active: "Active chapter",
};
export default function SchoolsDirectory() {
  return (
    <main id="main" className="wrap schools-page">
      <p className="eyebrow schools-kicker">SCHOOL DIRECTORY · QATAR</p>
      <h1 className="display schools-title" data-reveal="fade-up">
        Every connection starts somewhere.
      </h1>
      <p className="schools-lede" data-reveal="fade-up">
        Explore schools listed in our directory. A listing is for discovery only
        and does not mean the school is affiliated with or endorses ASTRA. No
        chapter status has been confirmed.
      </p>
      <div className="schools-directory" data-reveal-group="">
        {SCHOOLS.map((school) => (
          <Link
            className="schools-card"
            data-reveal="fade-up"
            href={`/schools/${school.slug}`}
            key={school.slug}
          >
            <span className="eyebrow">
              {school.location} · {status[school.chapterStatus]}
            </span>
            <strong data-reveal-visual="">{school.name}</strong>
            <small>School information and sources</small>
            <span className="school-card-bottom">Explore profile ↗</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

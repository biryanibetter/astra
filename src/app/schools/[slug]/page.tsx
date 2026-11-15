import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAPTER_STATUSES, getSchool, SCHOOLS } from "@/lib/schools";
import "@/components/schools/school-pages.css";
export function generateStaticParams() {
  return SCHOOLS.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchool(slug);
  return {
    title: school ? school.name : "School not found",
    description: school?.description,
  };
}
export default async function SchoolProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = getSchool(slug);
  if (!school) notFound();
  return (
    <main id="main" className="wrap school-profile">
      <Link className="school-profile-back" href="/schools">
        ← All schools
      </Link>
      <header className="school-profile-hero" data-reveal="section">
        <span className="eyebrow">SCHOOL DIRECTORY · {school.location}</span>
        <h1 className="display">{school.name}</h1>
        <p>{school.description}</p>
        <div className="school-factline">
          <span>Chapter status: {CHAPTER_STATUSES[school.chapterStatus]}</span>
          <span>Listing does not imply affiliation</span>
        </div>
        <div className="school-profile-actions">
          <Link
            className="school-action"
            href={`/schools/${school.slug}/apply?intent=interest`}
          >
            Express interest <span>↗</span>
          </Link>
          <Link
            className="school-action secondary"
            href={`/schools/${school.slug}/apply?intent=founding`}
          >
            Help start a chapter <span>↗</span>
          </Link>
        </div>
      </header>
      <div className="school-profile-grid" data-reveal-group="">
        <section data-reveal="section">
          <h2>About this listing</h2>
          <p>{school.description}</p>
          <p>
            ASTRA is a youth innovation network connecting students across
            schools. The directory helps students find a starting point; it does
            not mean a school has an ASTRA team. The idea is one student team
            per school, connected into one network.
          </p>
          <p className="school-status-note">
            This listing does not indicate partnership, affiliation,
            endorsement, or school authorization. Chapter status:{" "}
            {CHAPTER_STATUSES[school.chapterStatus]}. Expressing interest starts
            a conversation; founding interest helps explore whether a student
            team could form. Neither guarantees a chapter. Any activity requires
            separate school approval and appropriate guardian authorization
            before participation.
          </p>
          <p>
            Students can explore the network&apos;s{" "}
            <Link className="school-profile-back" href="/programs">
              programs and opportunities
            </Link>{" "}
            while deciding what they might like to contribute.
          </p>
          {school.website && (
            <p>
              <a
                className="school-profile-back"
                href={school.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit the school website ↗
              </a>
            </p>
          )}
        </section>
        <section data-reveal="section">
          <h2>Sources</h2>
          <p>School details are linked to their source material.</p>
          <ul className="school-source-list">
            {school.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

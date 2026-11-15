import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PathwayApplication } from "@/components/pathway-application";
import { findSchoolLocation } from "@/lib/school-locations";
import "../../join/join.css";
import "../apply.css";

type Props = {
  params: Promise<{ track: string }>;
  searchParams: Promise<{ school?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  return {
    title:
      track === "core"
        ? "Apply to Astra Core"
        : track === "fellow"
          ? "Apply to Astra Fellow"
          : "Application not found",
  };
}

export default async function Apply({ params, searchParams }: Props) {
  const [{ track }, query] = await Promise.all([params, searchParams]);
  if (track !== "core" && track !== "fellow") notFound();
  const school =
    typeof query.school === "string"
      ? findSchoolLocation(query.school)
      : undefined;
  const fellow = track === "fellow";
  return (
    <main id="main" className="join-page pathway-application wrap">
      <header className="pathway-header">
        <h1 className="display">Astra {fellow ? "Fellow" : "Core"}</h1>
        <p className="body-copy">
          {fellow
            ? "Explore the Fellow pathway for students building independent projects, research, startups, and leadership initiatives."
            : "Explore the Core pathway for students who want to contribute to Astra’s operations, events, projects, and school network."}
        </p>
      </header>
      <PathwayApplication
        key={`${track}-${school?.id ?? ""}`}
        track={track}
        initialSchool={school?.name ?? ""}
      />
    </main>
  );
}

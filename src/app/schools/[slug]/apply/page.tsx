import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SchoolApplication } from "@/components/schools/school-application";
import { ScrollReveals } from "@/components/scroll-reveals";
import "@/components/schools/school-pages.css";
import { getSchool } from "@/lib/schools";
import { applicationConfiguration } from "@/lib/server/config";
export const metadata: Metadata = {
  title: "School interest",
  description: "Express interest in an ASTRA school connection.",
};
export const dynamic = "force-dynamic";
export default async function SchoolApply({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intent?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const school = getSchool(slug);
  if (!school) notFound();
  const config = applicationConfiguration();
  const intent = query.intent === "founding" ? "founding" : "interest";
  return (
    <main id="main" className="wrap school-form-page">
      <ScrollReveals />
      <Link className="school-profile-back" href={`/schools/${school.slug}`}>
        ← {school.name}
      </Link>
      <p className="eyebrow schools-kicker">A SCHOOL CONNECTION</p>
      <h1 className="display">
        {intent === "founding"
          ? "Start a conversation."
          : "Curiosity starts here."}
      </h1>
      <p className="schools-lede" data-reveal="fade">
        For students aged 13–18. This is a private expression of interest, not
        membership approval, school authorization, or permission to participate.
      </p>
      <SchoolApplication
        school={school}
        initialIntent={intent}
        enabled={config.success}
        siteKey={
          config.success ? config.data.NEXT_PUBLIC_TURNSTILE_SITE_KEY : ""
        }
      />
    </main>
  );
}

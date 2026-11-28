import Image from "next/image";
import { WordRevealHeading } from "@/components/ui/word-reveal-heading";
import { MembersAnnouncement } from "./members-announcement";

const previews = Array.from({ length: 20 }, (_, index) => ({
  id: `preview-${index}`,
  index,
}));

type Member = { name: string; role: string; photo: string };

export function Members({
  mode = "announcement",
  roster = [],
}: {
  mode?: "announcement" | "published";
  roster?: readonly Member[];
}) {
  const published = mode === "published";
  const grid = (
    <div
      className="member-grid glass"
      data-reveal-group={published ? "" : undefined}
    >
      {previews.map(({ id, index }) => {
        const member = published ? roster[index] : undefined;
        const portrait = Boolean(member) || index < 6;
        const number = String(index + 1).padStart(2, "0");

        return (
          <div
            data-reveal={published ? "fade-up" : undefined}
            className={`member-card ${portrait ? `portrait portrait-${index % 4}` : "open-seat"}`}
            key={id}
          >
            <span className="member-number eyebrow" data-reveal-visual="">
              {number}
            </span>
            {member ? (
              <>
                <Image
                  src={member.photo}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 25vw, (max-width: 1000px) 33vw, 17vw"
                  className="member-roster-photo"
                />
                <span className="member-roster-caption" data-reveal-visual="">
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </span>
              </>
            ) : portrait ? (
              <>
                <svg viewBox="0 0 100 125" aria-hidden="true">
                  <circle cx="50" cy="48" r="17" fill="rgba(255,255,255,.14)" />
                  <path
                    d="M14 125C14 92 30 78 50 78S86 92 86 125Z"
                    fill="rgba(255,255,255,.14)"
                  />
                </svg>
                {published && (
                  <span
                    className="portrait-label eyebrow"
                    data-reveal-visual=""
                  >
                    Photo placeholder
                  </span>
                )}
              </>
            ) : (
              <span className="open-label eyebrow" data-reveal-visual="">
                <span aria-hidden="true">+</span>
                {published ? "Your place?" : null}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      className="wrap members-section home-section"
      aria-labelledby="members-heading"
    >
      <div className="section-heading">
        <div>
          <WordRevealHeading
            shimmer="home"
            as="h2"
            id="members-heading"
            className="display"
            style={{ color: "#FFFFFF" }}
            text="Founding members."
          />
        </div>
      </div>
      {published ? grid : <MembersAnnouncement>{grid}</MembersAnnouncement>}
    </section>
  );
}

import { WordRevealHeading } from "@/components/ui/word-reveal-heading";

const previews = Array.from({ length: 20 }, (_, index) => ({
  id: `preview-${index}`,
  index,
}));

export function Members() {
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
      <div className="member-grid glass" data-reveal-group="">
        {previews.map(({ id, index }) => (
          <button
            type="button"
            data-reveal="fade-up"
            className={`member-card ${index < 6 ? `portrait portrait-${index % 4}` : "open-seat"}`}
            key={id}
            aria-label={`${String(index + 1).padStart(2, "0")} ${index < 6 ? "Photo placeholder" : "Your place?"}: development preview`}
          >
            <span className="member-number eyebrow" data-reveal-visual="">
              {String(index + 1).padStart(2, "0")}
            </span>
            {index < 6 ? (
              <>
                <svg viewBox="0 0 100 125" aria-hidden="true">
                  <circle cx="50" cy="48" r="17" fill="rgba(255,255,255,.14)" />
                  <path
                    d="M14 125C14 92 30 78 50 78S86 92 86 125Z"
                    fill="rgba(255,255,255,.14)"
                  />
                </svg>
                <span className="portrait-label eyebrow" data-reveal-visual="">
                  Photo placeholder
                </span>
              </>
            ) : (
              <span className="open-label eyebrow" data-reveal-visual="">
                <span aria-hidden="true">+</span>Your place?
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

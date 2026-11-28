export function MembershipPathwayIcon({
  pathway,
  className,
}: {
  pathway: "core" | "fellow";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      {pathway === "core" ? (
        <>
          <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />
          <circle cx="12" cy="12" r="2" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <ellipse
            cx="12"
            cy="12"
            rx="11"
            ry="4"
            transform="rotate(-35 12 12)"
          />
          <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

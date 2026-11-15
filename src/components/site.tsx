import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SterlingGateKineticNavigation } from "@/components/ui/sterling-gate-kinetic-navigation";

export function AstraLogo({
  className = "",
  width,
  height,
}: {
  readonly className?: string;
  readonly width?: number | string;
  readonly height?: number | string;
}) {
  const w = width
    ? typeof width === "number"
      ? width
      : parseInt(width, 10)
    : 180;
  // Intrinsic ratio comes from the approved asset, never the old square mark.
  const h = Math.round((w * 366) / 931);
  return (
    <Image
      src="/branding/astra-logo-light.png"
      alt="Astra Youth Innovation Network"
      className={className}
      width={w}
      height={h}
      style={{
        display: "block",
        height: "auto",
        objectFit: "contain",
        maxHeight: height,
      }}
      unoptimized
      loading="eager"
    />
  );
}

export function Star({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        d="M50 0L56 44L90 50L56 56L50 100L44 56L10 50L44 44Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function JoinLink({
  children = "Join Astra",
  className = "",
  reveal = false,
}: {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly reveal?: boolean;
}) {
  return (
    <a
      href="/#schools-heading"
      className={`button ${className}`}
      data-reveal={reveal ? "cta" : undefined}
    >
      {children}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </a>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Astra home">
        <AstraLogo className="astra-brand-logo" width={110} />
      </Link>
      <SterlingGateKineticNavigation />
    </header>
  );
}

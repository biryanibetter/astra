"use client";

import type { ReactNode } from "react";
import GravityStars from "@/components/ui/gravity-stars";

/** Persistent root-layout background; never keyed to a route or application step. */
export function GlobalStarfield({ children }: { children: ReactNode }) {
  return (
    <>
      <GravityStars
        className="global-starfield"
        count={220}
        starSize={1.25}
        glow={4.2}
        gravity={0.45}
        speed={0.35}
        twinkle={0.4}
        tint={0.2}
        connect={false}
      />
      <div className="site-foreground">{children}</div>
    </>
  );
}

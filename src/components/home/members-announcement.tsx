"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function MembersAnnouncement({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const clearHover = () => setHovered(false);
    const onVisibilityChange = () => {
      if (document.hidden) clearHover();
    };
    window.addEventListener("blur", clearHover);
    window.addEventListener("pagehide", clearHover);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", clearHover);
      window.removeEventListener("pagehide", clearHover);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!activated) return;
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target)
      )
        setActivated(false);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setActivated(false);
      setHovered(false);
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [activated]);

  return (
    <div
      ref={panel}
      className="member-announcement"
      data-review-motion={
        process.env.NODE_ENV === "development" ? "" : undefined
      }
      data-grid-revealed={hovered || activated}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          !document.hidden &&
          document.hasFocus()
        )
          setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="member-announcement-grid" aria-hidden="true" inert>
        {children}
      </div>
      <div className="member-announcement-copy">
        <span className="member-announcement-symbol" aria-hidden="true">
          <span />
          <span />
          <span>+</span>
        </span>
        <h3>A team in the making.</h3>
        <p>
          Our founding members will be announced following the application
          process.
        </p>
        <span className="member-announcement-status">COMING SOON</span>
      </div>
      <button
        className="member-announcement-toggle"
        type="button"
        aria-label="Reveal founding member placeholders"
        aria-pressed={activated}
        onClick={() => setActivated((value) => !value)}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button, type ButtonProps } from "./button";
import "./shiny-button.css";

type Props = Omit<ComponentProps<typeof Link>, "children" | "onNavigate"> & {
  children: ReactNode;
};

/** A card-sized adaptation of the shiny perimeter treatment, not a CTA pill. */
export function ShinyButton({
  children,
  className = "",
  href,
  onClick,
  target,
  download,
  ...props
}: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const burstTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (burstTimer.current !== null) clearTimeout(burstTimer.current);
    },
    [],
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== "_self") ||
      download !== undefined
    )
      return;

    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--shiny-x",
      `${event.detail === 0 ? rect.width / 2 : event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--shiny-y",
      `${event.detail === 0 ? rect.height / 2 : event.clientY - rect.top}px`,
    );
    event.currentTarget.dataset.shinyPressed = "true";
    if (burstTimer.current !== null) clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => {
      if (linkRef.current) linkRef.current.dataset.shinyPressed = "false";
    }, 850);
  }

  return (
    <Link
      {...props}
      ref={linkRef}
      href={href}
      target={target}
      download={download}
      className={`shiny-button ${className}`}
      data-shiny-hover="false"
      data-shiny-focus="false"
      data-shiny-pressed="false"
      onPointerEnter={(event) => {
        event.currentTarget.dataset.shinyHover = "true";
      }}
      onPointerLeave={(event) => {
        event.currentTarget.dataset.shinyHover = "false";
      }}
      onFocus={(event) => {
        event.currentTarget.dataset.shinyFocus = "true";
      }}
      onBlur={(event) => {
        event.currentTarget.dataset.shinyFocus = "false";
      }}
      onClick={handleClick}
    >
      <ShinyMaterial>{children}</ShinyMaterial>
    </Link>
  );
}

/** The same material layers used by the network cards, on a real form button. */
export function ShinyMaterial({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const layer = surface.current;
    const button = layer?.parentElement;
    if (!layer || !button || typeof IntersectionObserver === "undefined")
      return;
    // Let the original CSS animations acquire their document start times before
    // allowing the browser to skip distant decorative descendants. The label,
    // hit target and their intrinsic layout never enter the skipped subtree.
    const observer = new IntersectionObserver(
      ([entry]) => {
        layer.toggleAttribute("data-distant", entry?.isIntersecting === false);
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <span className="shiny-button-content">{children}</span>
      <span ref={surface} className="shiny-button-surface" aria-hidden="true">
        <span className="shiny-button-border" />
        <span className="shiny-button-glimmer" />
        <span className="shiny-button-ripple" />
      </span>
    </>
  );
}

export function ShinyAction({
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Button
      variant="ghost"
      {...props}
      className={`shiny-button astra-card-glass ${className ?? ""}`}
      onClick={(event) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        button.style.setProperty(
          "--shiny-x",
          `${event.detail ? event.clientX - rect.left : rect.width / 2}px`,
        );
        button.style.setProperty(
          "--shiny-y",
          `${event.detail ? event.clientY - rect.top : rect.height / 2}px`,
        );
        button.dataset.shinyPressed = "true";
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          button.dataset.shinyPressed = "false";
        }, 850);
        onClick?.(event);
      }}
    >
      <ShinyMaterial>{children}</ShinyMaterial>
    </Button>
  );
}

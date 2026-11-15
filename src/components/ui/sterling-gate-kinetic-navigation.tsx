"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSmoothScroll } from "@/components/smooth-scroll-provider";
import { getReducedMotion, subscribeMotion } from "@/lib/motion-preference";
import "./sterling-gate-kinetic-navigation.css";

const links = [
  { href: "/", label: "Home", shape: 1 },
  { href: "/the-idea", label: "The Idea", shape: 2 },
  { href: "/#schools-heading", label: "Get Involved", shape: 3 },
  { href: "/whats-next", label: "What's Next", shape: 4 },
] as const;

// Coordinates and paths from the supplied Sterling Gate SVGs (not replacement artwork).
const networkDots = [
  [50, 50, 8],
  [150, 50, 8],
  [250, 50, 8],
  [350, 50, 8],
  [100, 150, 12],
  [200, 150, 12],
  [300, 150, 12],
  [50, 250, 10],
  [150, 250, 10],
  [250, 250, 10],
  [350, 250, 10],
  [100, 350, 6],
  [200, 350, 6],
  [300, 350, 6],
];

// Open ribs and tension curves echo the sculptural A without reproducing or
// changing the official logo. The original artwork remains on the reference route.
const orbitalForms: Record<number, readonly string[]> = {
  1: [
    "M88 318 202 72 316 318",
    "M116 318 202 108 288 318",
    "M144 318 202 145 260 318",
    "M126 242 Q202 202 278 254",
    "M66 286 C108 225 280 212 337 272",
  ],
  2: [
    "M62 298 184 86 302 298",
    "M92 316 210 104 328 316",
    "M122 334 236 122 350 334",
    "M104 256 Q216 198 326 274",
  ],
  3: [
    "M92 320 202 84 312 320",
    "M120 320 202 126 284 320",
    "M65 254 C100 186 287 167 338 235",
    "M72 275 C144 335 309 298 332 226",
    "M154 176 Q207 210 260 183",
  ],
  4: [
    "M74 324 198 76 328 324",
    "M104 324 198 114 296 324",
    "M134 324 198 152 266 324",
    "M96 272 Q200 216 308 272",
    "M114 292 Q200 245 290 292",
  ],
};

function OrbitalLines({ shape }: { readonly shape: number }) {
  return orbitalForms[shape]?.map((path) => (
    <path className="shape-element orbital-line" key={path} d={path} />
  ));
}

const referenceLinks = [
  { href: "#about", label: "About us", shape: 1 },
  { href: "#work", label: "Our work", shape: 2 },
  { href: "#services", label: "Services", shape: 3 },
  { href: "#blog", label: "Blog", shape: 4 },
  { href: "#contact", label: "Contact us", shape: 5 },
] as const;

export function SterlingGateKineticNavigation({
  reference = false,
}: {
  readonly reference?: boolean;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPresent, setIsPresent] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desiredOpenRef = useRef(false);
  const animateMenuRef = useRef<((open: boolean) => void) | null>(null);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  const closeMenu = useCallback(() => {
    desiredOpenRef.current = false;
    setIsOpen(false);
  }, []);

  const toggleMenu = () => {
    const open = !desiredOpenRef.current;
    desiredOpenRef.current = open;
    if (open) setIsPresent(true);
    setIsOpen(open);
  };

  // Build once before paint. State changes play/reverse this timeline; they never
  // revert its context or reset the panel to an endpoint mid-transition.
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    gsap.registerPlugin(CustomEase);
    CustomEase.create("astra-kinetic", "0.4, 0, 0.2, 1");

    const context = gsap.context(() => {
      const navWrap = root.querySelector<HTMLElement>(".nav-overlay-wrapper");
      const menu = root.querySelector<HTMLElement>(".menu-content");
      const overlay = root.querySelector<HTMLElement>(".overlay");
      const bgPanels = root.querySelectorAll<HTMLElement>(".backdrop-layer");
      const menuLinks = root.querySelectorAll<HTMLElement>(".nav-link");
      const buttonTexts = root.querySelectorAll(".menu-button-text > span");
      const buttonIcon = root.querySelector(".menu-button-icon");
      const shapesContainer = root.querySelector(".ambient-background-shapes");
      const atmosphere = root.querySelector<HTMLElement>(".nav-atmosphere");
      const shapes = root.querySelectorAll<SVGSVGElement>(".bg-shape");
      const hoverTimelines: gsap.core.Timeline[] = [];
      if (
        !navWrap ||
        !menu ||
        !overlay ||
        !shapesContainer ||
        !buttonIcon ||
        !atmosphere
      )
        return;

      let timeline: gsap.core.Timeline;
      let activeShape: SVGSVGElement | null = null;
      let activeItem: HTMLElement | null = null;
      let openingFrame: number | null = null;

      const positionAtmosphere = (item: HTMLElement) => {
        const row = item.getBoundingClientRect();
        const panel = menu.getBoundingClientRect();
        const y = row.top + row.height / 2 - panel.top;
        gsap.to(atmosphere, {
          y,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 0.65,
          ease: "power3.out",
          overwrite: true,
        });
      };

      const hideAtmosphere = () => {
        activeItem = null;
        gsap.to(atmosphere, {
          opacity: 0,
          scaleX: 1.04,
          scaleY: 1.08,
          duration: 0.5,
          ease: "power2.out",
          overwrite: true,
        });
      };

      const clearShapes = () => {
        activeShape = null;
        activeItem = null;
        gsap.killTweensOf(atmosphere);
        gsap.set(atmosphere, { opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 });
        hoverTimelines.forEach((hover) => {
          hover.pause(0);
        });
        shapes.forEach((shape) => {
          const elements = shape.querySelectorAll(".shape-element");
          gsap.killTweensOf(elements);
          gsap.set(elements, { opacity: 0, scale: 1, rotation: 0, x: 0, y: 0 });
          shape.classList.remove("active", "is-active");
        });
      };

      const hideShape = (shape: SVGSVGElement) => {
        if (activeShape === shape) activeShape = null;
        const elements = shape.querySelectorAll(".shape-element");
        gsap.killTweensOf(elements);
        gsap.to(elements, {
          scale: 0.82,
          rotation: 3,
          x: 6,
          y: -5,
          opacity: 0,
          duration: 0.34,
          stagger: { amount: 0.08, from: "end" },
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => {
            if (activeShape !== shape)
              shape.classList.remove("active", "is-active");
          },
        });
      };

      const showShape = (shape: SVGSVGElement) => {
        if (!desiredOpenRef.current || activeShape === shape) return;
        if (activeShape) hideShape(activeShape);
        activeShape = shape;
        const entering = !shape.classList.contains("active");
        shape.classList.add("active", "is-active");
        const elements = shape.querySelectorAll(".shape-element");
        gsap.killTweensOf(elements);
        // Explicit SVG origins are needed: CSS transform-origin alone is not
        // consistently interpreted when GSAP writes the SVG transform attribute.
        if (entering) {
          gsap.set(elements, {
            transformOrigin: "50% 50%",
            scale: 0.72,
            opacity: 0,
            rotation: -5,
            x: -8,
            y: 12,
          });
        }
        // A returning shape continues from its current frame, not a new fromTo
        // endpoint. Killing the stagger first also cancels pending child tweens.
        gsap.to(elements, {
          scale: 0.9,
          opacity: 1,
          rotation: 0,
          x: 0,
          y: 0,
          duration: (index) => (index % 2 ? 0.64 : 0.5),
          stagger: { amount: 0.14 },
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const finishClosed = () => {
        if (desiredOpenRef.current) return;
        navWrap.dataset.nav = "closed";
        gsap.set(navWrap, { autoAlpha: 0, pointerEvents: "none" });
        clearShapes();
        setIsPresent(false);
        // Do not steal initial page focus when the closed timeline is initialized.
        if (root.contains(document.activeElement))
          triggerRef.current?.focus({ preventScroll: true });
      };

      const buildTimeline = () => {
        timeline?.kill();
        clearShapes();
        const menuStart = {
          xPercent: 101,
          x: 0,
          opacity: 1,
        };
        const panelsStart = {
          xPercent: 101,
          opacity: 1,
        };
        const linksStart = {
          yPercent: 140,
          rotation: 10,
          opacity: 0,
        };
        gsap.set(navWrap, { autoAlpha: 0, pointerEvents: "none" });
        gsap.set(menu, menuStart);
        gsap.set(bgPanels, panelsStart);
        gsap.set(menuLinks, linksStart);
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(buttonTexts, { yPercent: 0 });
        gsap.set(buttonIcon, { rotation: 0 });

        timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "astra-kinetic" },
          onComplete: () => {
            if (!desiredOpenRef.current) return;
            navWrap.dataset.nav = "open";
            menuLinks[0]?.focus({ preventScroll: true });
          },
          onReverseComplete: finishClosed,
        });
        timeline
          // This is a tween, not the supplied instantaneous .set(menu, {xPercent: 0}).
          .fromTo(
            menu,
            menuStart,
            {
              xPercent: 0,
              x: 0,
              opacity: 1,
              duration: 0.82,
              immediateRender: false,
            },
            0,
          )
          .fromTo(
            bgPanels,
            panelsStart,
            {
              xPercent: 0,
              opacity: 1,
              stagger: 0.12,
              duration: 0.72,
              immediateRender: false,
            },
            0,
          )
          .to(overlay, { autoAlpha: 1, duration: 0.65 }, 0)
          .to(buttonTexts, { yPercent: -100, duration: 0.4 }, 0)
          .to(buttonIcon, { rotation: 315, duration: 0.4 }, 0)
          .fromTo(
            menuLinks,
            linksStart,
            {
              yPercent: 0,
              rotation: 0,
              opacity: 1,
              stagger: 0.05,
              duration: 0.55,
              immediateRender: false,
            },
            0.3,
          );

        timeline.pause(0);
        // A queued first click can arrive before hydration/Strict Mode setup
        // finishes. Do not skip straight to progress(1) in that case: the
        // state controller below must play the initialized closed timeline.
        if (!desiredOpenRef.current) finishClosed();
      };

      buildTimeline();
      animateMenuRef.current = (open) => {
        // Late event animations are added to this context too, so Strict Mode
        // cleanup removes them along with the persistent menu timeline.
        context.add(() => {
          if (openingFrame !== null) {
            cancelAnimationFrame(openingFrame);
            openingFrame = null;
          }
          if (getReducedMotion()) {
            gsap.set(navWrap, {
              autoAlpha: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
            });
            timeline.pause().progress(open ? 1 : 0);
            navWrap.dataset.nav = open ? "open" : "closed";
            if (!open) finishClosed();
            return;
          }
          if (open) {
            gsap.set(navWrap, { autoAlpha: 1, pointerEvents: "auto" });
            navWrap.dataset.nav =
              timeline.progress() === 1 ? "open" : "opening";
            // Start on a fresh frame after render/scroll lock, so busy hydration
            // does not consume the beginning of the visible transition.
            openingFrame = requestAnimationFrame(() => {
              openingFrame = null;
              // Closing has its own local playback rate. Always restore normal
              // forward speed, including when reversing an interrupted close.
              if (desiredOpenRef.current) timeline.timeScale(1).play();
            });
          } else {
            navWrap.dataset.nav = "closing";
            hideAtmosphere();
            hoverTimelines.forEach((hover) => {
              hover.reverse();
            });
            shapes.forEach((shape) => {
              if (shape.classList.contains("active")) hideShape(shape);
            });
            if (timeline.time() === 0) finishClosed();
            else {
              // Reverse the same playhead, never seek or rebuild it. A full
              // close is 750ms on every device.
              timeline.timeScale(timeline.duration() / 0.75).reverse();
            }
          }
        });
      };

      const cleanups: (() => void)[] = [];
      const unsubscribeMotion = subscribeMotion(() => {
        if (!getReducedMotion()) return;
        if (openingFrame !== null) cancelAnimationFrame(openingFrame);
        openingFrame = null;
        clearShapes();
        animateMenuRef.current?.(desiredOpenRef.current);
      });
      root
        .querySelectorAll<HTMLElement>(".menu-list-item[data-shape]")
        .forEach((item) => {
          const shape = shapesContainer.querySelector<SVGSVGElement>(
            `.bg-shape-${item.dataset.shape}`,
          );
          if (!shape) return;
          const hover = gsap
            .timeline({
              paused: true,
              defaults: { ease: "power2.out", duration: 0.24 },
            })
            .fromTo(
              item.querySelector(".nav-link-hover-bg"),
              // Reset the pixel translation parsed from the pre-hydration CSS
              // fallback, otherwise it adds to GSAP's percentage translation.
              { y: 0, yPercent: 101 },
              { y: 0, yPercent: 0 },
              0,
            )
            .fromTo(
              item.querySelector(".nav-link-text"),
              { color: "#D0D2D6" },
              { color: "var(--bg-elevated)" },
              0,
            );
          hoverTimelines.push(hover);
          const onEnter = () =>
            context.add(() => {
              if (!desiredOpenRef.current) return;
              if (getReducedMotion()) {
                hover.pause().progress(1);
                return;
              }
              if (Number(gsap.getProperty(atmosphere, "opacity")) === 0) {
                const row = item.getBoundingClientRect();
                gsap.set(atmosphere, {
                  y:
                    row.top + row.height / 2 - menu.getBoundingClientRect().top,
                  scaleX: 0.94,
                  scaleY: 0.88,
                });
              }
              activeItem = item;
              positionAtmosphere(item);
              hover.timeScale(1).play();
              showShape(shape);
            });
          const onLeave = () =>
            context.add(() => {
              if (item.querySelector(":focus-visible")) return;
              if (getReducedMotion()) {
                hover.pause().progress(0);
                return;
              }
              hover.reverse();
              hideShape(shape);
              if (activeItem === item) hideAtmosphere();
            });
          const onFocus = () => {
            if (item.querySelector(":focus-visible")) onEnter();
          };
          item.addEventListener("mouseenter", onEnter);
          item.addEventListener("mouseleave", onLeave);
          item.addEventListener("focusin", onFocus);
          item.addEventListener("focusout", onLeave);
          cleanups.push(() => {
            item.removeEventListener("mouseenter", onEnter);
            item.removeEventListener("mouseleave", onLeave);
            item.removeEventListener("focusin", onFocus);
            item.removeEventListener("focusout", onLeave);
          });
        });
      const onGeometryChange = () =>
        context.add(() => {
          if (activeItem) positionAtmosphere(activeItem);
        });
      const scrollArea = root.querySelector(".menu-content-wrapper");
      scrollArea?.addEventListener("scroll", onGeometryChange, {
        passive: true,
      });
      window.addEventListener("resize", onGeometryChange);
      return () => {
        unsubscribeMotion();
        if (openingFrame !== null) cancelAnimationFrame(openingFrame);
        cleanups.forEach((cleanup) => {
          cleanup();
        });
        scrollArea?.removeEventListener("scroll", onGeometryChange);
        window.removeEventListener("resize", onGeometryChange);
      };
    }, root);

    return () => {
      animateMenuRef.current = null;
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    animateMenuRef.current?.(isOpen);
  }, [isOpen]);

  // Keep the panel's back control level with Close, independent of logo size
  // and responsive header spacing. The panel only animates horizontally.
  useLayoutEffect(() => {
    if (!isPresent) return;
    const alignControls = () => {
      const trigger = triggerRef.current;
      const panel =
        containerRef.current?.querySelector<HTMLElement>(".menu-content");
      if (!trigger || !panel) return;
      const button = trigger.getBoundingClientRect();
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--menu-controls-center-y",
        `${button.top + button.height / 2 - bounds.top - panel.clientTop}px`,
      );
    };
    alignControls();
    window.addEventListener("resize", alignControls);
    return () => window.removeEventListener("resize", alignControls);
  }, [isPresent]);

  // Presence lasts through reverse completion, not just until CLOSE is clicked.
  const lenis = useSmoothScroll();
  useEffect(() => {
    if (!isPresent) return;
    const wasStopped = lenis?.isStopped;
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Isolate page content without changing any pre-existing inert state.
    const background = [
      ...document.querySelectorAll<HTMLElement>(
        "body > main, body > footer, .site-header > .brand, body > .skip-link",
      ),
    ].filter((element) => !element.contains(containerRef.current));
    const inertStates = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
      if (event.key !== "Tab") return;
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        ".compact-navigation a, .compact-navigation button, .menu-back-button, .menu-list a",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (!wasStopped) lenis?.start();
      background.forEach((element, index) => {
        element.inert = inertStates[index] ?? false;
      });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, isPresent, lenis]);

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-modal is present only together with role="dialog" while open.
    <div
      className={`kinetic-navigation${reference ? " kinetic-reference" : ""}`}
      ref={containerRef}
      role={isPresent ? "dialog" : undefined}
      aria-modal={isPresent ? true : undefined}
      aria-label={isPresent ? "Main navigation" : undefined}
    >
      <nav className="compact-navigation" aria-label="Main navigation">
        <button
          ref={triggerRef}
          className="kinetic-menu-trigger nav-close-btn"
          type="button"
          aria-label={isOpen ? "Close" : "Menu"}
          aria-expanded={isOpen}
          aria-controls={
            reference ? "sterling-reference-menu" : "sterling-menu"
          }
          onClick={toggleMenu}
        >
          <span className="menu-button-text" aria-hidden="true">
            <span>Menu</span>
            <span>Close</span>
          </span>
          <svg
            className="menu-button-icon"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7.33333 16L7.33333 0L8.66667 0L8.66667 16L7.33333 16Z"
              fill="currentColor"
            />
            <path
              d="M16 8.66667L0 8.66667L0 7.33333L16 7.33333L16 8.66667Z"
              fill="currentColor"
            />
            <path
              d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z"
              fill="currentColor"
            />
            <path
              d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z"
              fill="currentColor"
            />
            <path
              d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z"
              fill="currentColor"
            />
            <path
              d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </nav>

      <div
        className="nav-overlay-wrapper kinetic-menu-overlay"
        id={reference ? "sterling-reference-menu" : "sterling-menu"}
        data-nav="closed"
        aria-hidden={!isPresent}
        inert={!isPresent}
      >
        <button
          className="overlay kinetic-menu-backdrop"
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={closeMenu}
        />
        <nav className="menu-content" aria-label="Expanded main navigation">
          <div className="menu-bg" aria-hidden="true">
            <div className="backdrop-layer first backdrop-layer-first" />
            <div className="backdrop-layer second backdrop-layer-second" />
            <div className="backdrop-layer backdrop-layer-final" />
            <div className="nav-atmosphere" />
            <div className="ambient-background-shapes">
              <svg
                className="bg-shape bg-shape-1 kinetic-shape"
                data-shape="home"
                viewBox="0 0 400 400"
                fill="none"
              >
                <title>
                  {reference ? "Floating circular forms" : "Orbital A ribs"}
                </title>
                {reference ? (
                  <>
                    <circle className="shape-element" cx="80" cy="120" r="40" />
                    <circle className="shape-element" cx="300" cy="80" r="60" />
                    <circle
                      className="shape-element"
                      cx="200"
                      cy="300"
                      r="80"
                    />
                    <circle
                      className="shape-element"
                      cx="350"
                      cy="280"
                      r="30"
                    />
                  </>
                ) : (
                  <OrbitalLines shape={1} />
                )}
              </svg>
              <svg
                className="bg-shape bg-shape-5 kinetic-shape"
                viewBox="0 0 400 400"
                fill="none"
              >
                <title>Diagonal lines</title>
                <line
                  className="shape-element"
                  x1="0"
                  y1="100"
                  x2="300"
                  y2="400"
                  strokeWidth="30"
                />
                <line
                  className="shape-element"
                  x1="100"
                  y1="0"
                  x2="400"
                  y2="300"
                  strokeWidth="25"
                />
                <line
                  className="shape-element"
                  x1="200"
                  y1="0"
                  x2="400"
                  y2="200"
                  strokeWidth="20"
                />
              </svg>
              <svg
                className="bg-shape bg-shape-2 kinetic-shape"
                data-shape="programs"
                viewBox="0 0 400 400"
                fill="none"
              >
                <title>
                  {reference ? "Wave pattern" : "Folded trajectories"}
                </title>
                {reference ? (
                  <>
                    <path
                      className="shape-element"
                      d="M0 200 Q100 100, 200 200 T 400 200"
                      strokeWidth="60"
                      fill="none"
                    />
                    <path
                      className="shape-element"
                      d="M0 280 Q100 180, 200 280 T 400 280"
                      strokeWidth="40"
                      fill="none"
                    />
                  </>
                ) : (
                  <OrbitalLines shape={2} />
                )}
              </svg>
              <svg
                className="bg-shape bg-shape-3 kinetic-shape"
                data-shape="network"
                viewBox="0 0 400 400"
                fill="none"
              >
                <title>
                  {reference ? "Grid dots" : "Intersecting orbital paths"}
                </title>
                {reference ? (
                  networkDots.map(([x, y, radius]) => (
                    <circle
                      className="shape-element"
                      key={`${x}-${y}`}
                      cx={x}
                      cy={y}
                      r={radius}
                    />
                  ))
                ) : (
                  <OrbitalLines shape={3} />
                )}
              </svg>
              <svg
                className="bg-shape bg-shape-4 kinetic-shape"
                data-shape="events"
                viewBox="0 0 400 400"
                fill="none"
              >
                <title>
                  {reference ? "Organic forms" : "Ascending A contours"}
                </title>
                {reference ? (
                  <>
                    <path
                      className="shape-element"
                      d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100"
                    />
                    <path
                      className="shape-element"
                      d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200"
                    />
                  </>
                ) : (
                  <OrbitalLines shape={4} />
                )}
              </svg>
            </div>
          </div>
          {canGoBack && (
            <button
              className="menu-back-button"
              type="button"
              aria-label="Back to previous page"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                }
                closeMenu();
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path
                  d="M14 8H2M7 3L2 8L7 13"
                  stroke="currentColor"
                  strokeWidth="1.33"
                />
              </svg>
            </button>
          )}
          <div className="menu-content-wrapper" data-lenis-prevent>
            <ul className="menu-list kinetic-menu-list">
              {(reference ? referenceLinks : links).map((link) => (
                <li
                  className="menu-list-item kinetic-link-clip"
                  data-shape={link.shape}
                  key={link.href}
                >
                  <Link
                    className="nav-link kinetic-menu-link kinetic-link-inner"
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <span className="nav-link-text">{link.label}</span>
                    <div className="nav-link-hover-bg" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

export { SterlingGateKineticNavigation as Component };

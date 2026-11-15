"use client";

import * as React from "react";
import { getReducedMotion, subscribeMotion } from "@/lib/motion-preference";

export interface WorksWheelItem {
  title: string;
  image: string;
  href?: string;
}

export interface WorksWheelProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "children"> {
  items: readonly WorksWheelItem[];
  label?: string;
  action?: string;
}

const CARD_H = 0.38;
const CARD_RATIO = 1.45;
const STEP = 40;
const DRUM = 2.22;
const LENS = 2.7;
const RING_R = 1.14;
const BOW = 1.82;
const TITLE = 0.124;
const INDEX = 0.04;

const DRAG_UNITS = 420;
const EASE_TAU = 120;
const WHEEL_GESTURE_END = 280;

const clamp = (value: number, lower: number, upper: number) =>
  Math.min(upper, Math.max(lower, value));
const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

type Stage = { w: number; h: number };

const bowAt = (drumDegrees: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDegrees)));

function place(
  ringDegrees: number,
  drumDegrees: number,
  ringRadius: number,
  drumRadius: number,
  bow: number,
  morph: number,
) {
  return (
    `translateX(${morph * bowAt(drumDegrees, bow)}px)` +
    ` rotateZ(${(1 - morph) * ringDegrees}deg)` +
    ` translateY(${-(1 - morph) * ringRadius}px)` +
    ` rotateX(${morph * drumDegrees}deg)` +
    ` translateZ(${morph * drumRadius}px)`
  );
}

const conceptArtwork = (
  title: string,
  accent: string,
  orbit: string,
  offset: number,
) => {
  const artwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 800" role="img" aria-label="Abstract placeholder artwork for ${title}">
  <defs>
    <radialGradient id="glow" cx="${30 + offset}%" cy="${24 + offset / 2}%" r="80%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".72"/>
      <stop offset=".42" stop-color="#101218"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${accent}"/><stop offset="1" stop-color="${orbit}" stop-opacity=".16"/>
    </linearGradient>
  </defs>
  <rect width="1160" height="800" fill="url(#glow)"/>
  <circle cx="${580 + offset * 3}" cy="400" r="250" fill="none" stroke="url(#line)" stroke-width="2"/>
  <circle cx="${580 + offset * 3}" cy="400" r="168" fill="#000" fill-opacity=".26" stroke="${accent}" stroke-opacity=".46"/>
  <path d="M70 ${620 - offset * 2}C300 ${160 + offset * 5} 770 ${700 - offset * 4} 1090 170" fill="none" stroke="${orbit}" stroke-opacity=".62" stroke-width="3" stroke-dasharray="4 18"/>
  <path d="M120 690L1040 110M210 760L1110 230" stroke="${accent}" stroke-opacity=".14"/>
  <circle cx="${315 + offset * 8}" cy="${250 + offset * 4}" r="11" fill="${accent}"/>
  <circle cx="${815 - offset * 5}" cy="${565 - offset * 2}" r="7" fill="${orbit}"/>
  <text x="58" y="92" fill="#fff" fill-opacity=".68" font-family="Arial, sans-serif" font-size="22" letter-spacing="5">ASTRA / CONCEPT</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(artwork)}`;
};

export const ASTRA_WORKS_WHEEL_MOCK_ITEMS: readonly WorksWheelItem[] = [
  {
    title: "Launch Night Concept",
    image: conceptArtwork("Launch Night Concept", "#C6CCD5", "#F5F6F8", 2),
    href: "/events",
  },
  {
    title: "School Network Concept",
    image: conceptArtwork("School Network Concept", "#8E9BAE", "#FFFFFF", 8),
    href: "/network",
  },
  {
    title: "Build Day Concept",
    image: conceptArtwork("Build Day Concept", "#C6CCD5", "#8E9BAE", 14),
    href: "/events",
  },
  {
    title: "Idea Lab Concept",
    image: conceptArtwork("Idea Lab Concept", "#C6CCD5", "#8E9BAE", 20),
    href: "/about",
  },
  {
    title: "Youth Showcase Concept",
    image: conceptArtwork("Youth Showcase Concept", "#8E9BAE", "#C6CCD5", 26),
    href: "/events",
  },
  {
    title: "Future Makers Concept",
    image: conceptArtwork("Future Makers Concept", "#8E9BAE", "#FFFFFF", 32),
    href: "/join",
  },
] as const;

const classes = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(" ");

export function WorksWheel({
  items,
  label = "Astra Concept Lab",
  action = "Explore",
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const frame = React.useRef(0);
  const lastFrameTime = React.useRef(0);
  const draw = React.useRef<(timestamp: number) => void>(() => {});
  const visible = React.useRef(true);
  const drag = React.useRef<number | null>(null);
  const hasInteracted = React.useRef(false);
  const wheelGestureTimer = React.useRef(0);
  const optionId = React.useId();

  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const read = () =>
      setStage({ w: element.clientWidth, h: element.clientHeight });
    read();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    observer?.observe(element);
    window.addEventListener("resize", read);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const maxWidth = w < 640 ? 0.64 : w < 1024 ? 0.48 : 0.34;
    const cardWidth = Math.min(h * CARD_H * CARD_RATIO, w * maxWidth);
    const cardHeight = cardWidth / CARD_RATIO;
    const drumRadius = cardHeight * DRUM;
    const stageLimit = Math.min(w, h);
    const ringRadius = Math.min(cardHeight * RING_R, stageLimit * 0.205);
    const spacingScale = count
      ? clamp(
          (((2 * Math.PI * ringRadius) / count) * 0.82) / (cardWidth || 1),
          0.16,
          1,
        )
      : 1;
    const fitScale = clamp(
      (stageLimit * 0.9 - 2 * ringRadius) /
        (Math.hypot(cardWidth, cardHeight) || 1),
      0.12,
      1,
    );
    const ringScale = Math.min(spacingScale, fitScale);
    return {
      cardWidth,
      cardHeight,
      ringRadius,
      ringScale,
      drumRadius,
      bow: cardHeight * BOW,
      depth: Math.max(cardHeight * LENS, 1),
      title: clamp(cardHeight * TITLE, 18, 42),
      index: clamp(cardHeight * INDEX, 10, 14),
    };
  }, [stage, count]);

  const startDrawing = React.useCallback(() => {
    if (!frame.current && visible.current && !document.hidden) {
      frame.current = requestAnimationFrame((timestamp) =>
        draw.current(timestamp),
      );
    }
  }, []);

  React.useEffect(() => {
    if (!stage.h) return;
    const { ringRadius, ringScale, drumRadius, bow } = metrics;

    draw.current = (timestamp) => {
      frame.current = 0;
      if (!visible.current || document.hidden) return;

      const gap = target.current - turn.current;
      const moving = !getReducedMotion() && Math.abs(gap) >= 0.001;
      const elapsed = lastFrameTime.current
        ? clamp(timestamp - lastFrameTime.current, 0, 250)
        : 16.67;
      lastFrameTime.current = timestamp;
      if (!moving) turn.current = target.current;
      else {
        const damping = 1 - Math.exp(-elapsed / EASE_TAU);
        turn.current += gap * damping;
        if (Math.abs(target.current - turn.current) < 0.001)
          turn.current = target.current;
      }

      const currentTurn = turn.current;
      const morph = 1 - clamp(currentTurn - last, 0, 1);
      const position = clamp(currentTurn, 0, last);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-morph * drumRadius}px)`;
      }

      for (let index = 0; index < count; index++) {
        const distance = index - position;
        const drumDegrees = distance * STEP;
        const card = cardRefs.current[index];
        if (card) {
          card.style.transform = place(
            distance * (360 / count),
            drumDegrees,
            ringRadius,
            drumRadius,
            bow,
            morph,
          );
          const drumOpacity = clamp(1 - Math.abs(distance), 0, 1);
          const opacity = lerp(1, drumOpacity, morph);
          card.style.opacity = String(opacity);
          card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
          card.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
          card.style.willChange = moving ? "transform, opacity" : "auto";
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) {
          face.style.transform = `scale(${lerp(ringScale, 1, morph)})`;
          face.style.willChange = moving ? "transform" : "auto";
        }
      }

      if (labelRef.current) {
        labelRef.current.style.opacity = String(1 - morph);
      }
      if (titleRef.current) {
        titleRef.current.style.opacity = String(morph);
      }
      if (hasInteracted.current) {
        const near = clamp(Math.round(position), 0, last);
        setActive((previous) => (previous === near ? previous : near));
      }

      if (moving) startDrawing();
      else lastFrameTime.current = 0;
    };

    draw.current(performance.now());
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [count, last, metrics, stage.h, startDrawing]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            lastFrameTime.current = 0;
            visible.current = entry?.isIntersecting ?? false;
            if (visible.current) startDrawing();
            else {
              cancelAnimationFrame(frame.current);
              frame.current = 0;
            }
          });
    const onVisibilityChange = () => {
      lastFrameTime.current = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      } else {
        startDrawing();
      }
    };

    observer?.observe(element);
    const unsubscribeMotion = subscribeMotion(() => {
      lastFrameTime.current = 0;
      startDrawing();
    });
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      unsubscribeMotion();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [startDrawing]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, count ? last + 1 : 0);
      startDrawing();
    },
    [count, last, startDrawing],
  );

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element || !count) return;
    let gestureConsumed = false;
    const onWheel = (event: WheelEvent) => {
      const direction = Math.sign(event.deltaY);
      if (!direction) return;
      window.clearTimeout(wheelGestureTimer.current);
      wheelGestureTimer.current = window.setTimeout(() => {
        gestureConsumed = false;
      }, WHEEL_GESTURE_END);
      if (gestureConsumed) {
        if (target.current > 0 && target.current < last + 1)
          event.preventDefault();
        return;
      }
      gestureConsumed = true;
      const next = clamp(Math.round(target.current) + direction, 0, last + 1);
      if (
        next === target.current &&
        (direction < 0 ? target.current <= 0 : target.current >= last + 1)
      )
        return;
      event.preventDefault();
      hasInteracted.current = true;
      to(next);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelGestureTimer.current);
    };
  }, [count, last, to]);

  const selectFromKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    hasInteracted.current = true;
    let next: number;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      next = Math.round(target.current) + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      next = Math.round(target.current) - 1;
    } else if (event.key === "Home") {
      next = count ? 1 : 0;
    } else if (event.key === "End") {
      next = count ? last + 1 : 0;
    } else {
      return;
    }
    event.preventDefault();
    to(next);
  };

  return (
    <section
      aria-label={label}
      className={classes(
        "relative min-h-[30rem] w-full overflow-hidden border-y border-[#C6CCD5]/20 bg-black text-white select-none sm:min-h-[38rem] lg:min-h-[46rem]",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={count ? `${optionId}-work-${active}` : undefined}
        aria-orientation="vertical"
        className="absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#C6CCD5] active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          if (!count) return;
          hasInteracted.current = true;
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (event.clientY - drag.current) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
        }}
        onPointerCancel={() => {
          drag.current = null;
          to(Math.round(target.current));
        }}
        onKeyDown={selectFromKeyboard}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, index) => {
            const Card = item.href ? "a" : "div";
            return (
              <Card
                id={`${optionId}-work-${index}`}
                key={item.title}
                role="option"
                aria-label={item.title}
                aria-selected={index === active}
                href={item.href}
                ref={(node: HTMLElement | null) => {
                  cardRefs.current[index] = node;
                }}
                className="group absolute block [backface-visibility:hidden]"
                style={{
                  width: metrics.cardWidth,
                  height: metrics.cardHeight,
                  marginLeft: -metrics.cardWidth / 2,
                  marginTop: -metrics.cardHeight / 2,
                }}
              >
                <span className="relative block size-full overflow-hidden rounded-[3px] border border-[#C6CCD5]/45 bg-slate shadow-[0_22px_70px_-22px_rgba(204,204,204,0.25)]">
                  {/* biome-ignore lint/performance/noImgElement: Sources are dynamic wheel data and may be replaced by callers. */}
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="size-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.52))]" />
                  {action && item.href ? (
                    <span className="pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1.5 rounded-[2px] border border-[#C6CCD5]/35 bg-black/80 px-2.5 py-1.5 font-mono text-[0.65rem] tracking-[0.08em] text-[#C6CCD5] uppercase opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                      <svg
                        viewBox="0 0 12 12"
                        className="size-2.5"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 9 9 3M4 3h5v5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {action}
                    </span>
                  ) : null}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      <div
        ref={labelRef}
        className="display pointer-events-none absolute inset-0 grid place-items-center px-20 text-center text-white"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>
      <div
        ref={titleRef}
        aria-live="polite"
        className="display pointer-events-none absolute bottom-[7%] left-5 max-w-[52%] text-balance text-[#C6CCD5] opacity-0 sm:top-1/2 sm:bottom-auto sm:left-[6%] sm:max-w-[24%] sm:-translate-y-1/2"
        style={{ fontSize: metrics.title }}
      >
        {items[active]?.title}
      </div>

      <ol
        className="absolute top-[5%] right-[3%] max-w-[36%] text-right font-mono leading-[1.75] text-white/55 sm:top-[7.5%] sm:max-w-[25%]"
        style={{ fontSize: metrics.index }}
      >
        {items.map((item, index) => (
          <li key={`${item.title}-index`}>
            <button
              type="button"
              onClick={() => {
                hasInteracted.current = true;
                to(index + 1);
              }}
              aria-current={index === active ? "true" : undefined}
              className={classes(
                "cursor-pointer border-0 bg-transparent p-0 text-right text-inherit transition-colors outline-none hover:text-[#C6CCD5] focus-visible:text-[#C6CCD5] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#C6CCD5]",
                index === active && "font-medium text-white",
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ol>

      <p className="pointer-events-none absolute bottom-[3%] left-5 font-mono text-[0.625rem] tracking-[0.08em] text-white/45 uppercase sm:left-[3%]">
        Development concepts · Replace before launch
      </p>
    </section>
  );
}

export default WorksWheel;

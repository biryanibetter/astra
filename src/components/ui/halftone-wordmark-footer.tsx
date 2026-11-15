"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";
import astraArtwork from "./halftone-footer-artwork.json";

export interface HalftonePalette {
  background: string;
  ink: string;
  warm: string;
}
export type HalftonePreset = "night" | "paper" | "ember" | "cobalt";
export type FooterLink = { label: string; href?: string };
export type FooterColumn = { title: string; links: FooterLink[] };
export type HalftoneWordmarkFooterProps = {
  wordmark?: string;
  label?: string;
  meta?: string;
  brandContent?: ReactNode;
  columns?: FooterColumn[];
  showTop?: boolean;
  showBrand?: boolean;
  utilityBelowArtwork?: boolean;
  utility?: ReactNode;
  preset?: HalftonePreset;
  palette?: Partial<HalftonePalette>;
  dotGap?: number;
  radius?: number;
  crop?: number;
  grain?: number;
  interactive?: boolean;
  fontFamily?: string;
  fontWeight?: number;
  monoFamily?: string;
  height?: string;
  className?: string;
};

const presets: Record<HalftonePreset, HalftonePalette> = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
};

export function hwfHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) return null;
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((part) => part + part)
          .join("")
      : value;
  const number = Number.parseInt(normalized, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}
export function hwfRadius(coverage: number, gap: number): number {
  return Math.sqrt(Math.max(0, Math.min(1, coverage))) * gap * 0.56;
}
export function hwfStep(
  x: number,
  y: number,
  vx: number,
  vy: number,
  hx: number,
  hy: number,
  px: number,
  py: number,
  r: number,
): [number, number, number, number] {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / r) * 2.6;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  vx = (vx + (hx - x) * 0.05) * 0.84;
  vy = (vy + (hy - y) * 0.05) * 0.84;
  return [x + vx, y + vy, vx, vy];
}
export function hwfWarmth(
  x: number,
  y: number,
  hx: number,
  hy: number,
  span: number,
): number {
  const distance = Math.hypot(x - hx, y - hy);
  return span > 0 ? Math.min(1, distance / span) : 0;
}
export function hwfFitSize(measured: number, width: number): number {
  return measured > 0 ? (width / measured) * 100 : 0;
}

// The approved 1440px desktop composition is also the simulation's coordinate
// system. Layout and raster resolution must never become sources of typography.
const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 560;
const MAX_PARTICLES = 20000;
const MAX_BUFFER_PIXELS = 8000000;
const PHYSICS_STEP_MS = 1000 / 60;

// One immutable source for the server-visible SVG and interactive particle homes.
// Generated from the approved renderer; no browser/font measurements at startup.
const ASTRA_DOTS_PATH = astraArtwork.particles
  .map(([x = 0, y = 0, r = 0]) => {
    const n = (value: number) => Number(value.toFixed(4));
    return `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`;
  })
  .join("");

function getContext(canvas: HTMLCanvasElement | null) {
  try {
    return canvas?.getContext("2d") ?? null;
  } catch {
    return null;
  }
}

const defaults: FooterColumn[] = [
  {
    title: "Work",
    links: [{ label: "Index" }, { label: "Archive" }, { label: "Journal" }],
  },
  {
    title: "Studio",
    links: [{ label: "About" }, { label: "Process" }, { label: "Careers" }],
  },
  {
    title: "Contact",
    links: [{ label: "hello@halden.co" }, { label: "+47 22 00 41 00" }],
  },
];

const sansStack =
  '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const monoStack =
  '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace';

export default function HalftoneWordmarkFooter({
  wordmark = "halden",
  label = "Halden Studio",
  meta = "©2026 · Oslo / Lisbon",
  brandContent,
  columns = defaults,
  showTop = true,
  showBrand = true,
  utilityBelowArtwork = false,
  utility,
  preset = "night",
  palette,
  dotGap = 6,
  radius = 80,
  grain = 0.5,
  interactive = true,
  fontFamily = sansStack,
  fontWeight = 800,
  monoFamily = monoStack,
  height = "560px",
  className = "",
}: HalftoneWordmarkFooterProps) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = { ...presets[preset], ...palette };
  const canonicalArtwork =
    wordmark === "ASTRA." &&
    fontFamily === "Inter, sans-serif" &&
    fontWeight === 800 &&
    dotGap === 6;
  const artworkScale = canonicalArtwork ? 0.94 : 1;
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (root) delete root.dataset.canvasReady;
    const ctx = getContext(canvas);
    if (!root || !canvas || !ctx) return;
    const mask = document.createElement("canvas");
    const maskCtx = getContext(mask);
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = grainCanvas.height = 96;
    const grainCtx = getContext(grainCanvas);
    if (!maskCtx || !grainCtx) return;
    try {
      const grainData = grainCtx.createImageData(96, 96);
      for (let i = 0; i < grainData.data.length; i += 4) {
        const n = Math.random() * 255;
        grainData.data[i] = n;
        grainData.data[i + 1] = n;
        grainData.data[i + 2] = n;
        grainData.data[i + 3] = 22;
      }
      grainCtx.putImageData(grainData, 0, 0);
    } catch {
      // A failed offscreen allocation must not escape React's effect and
      // replace the usable server-rendered footer with an error boundary.
      return;
    }
    let dots = new Float32Array();
    let width = 0;
    let heightPx = 0;
    let frame = 0;
    let lastFrameTime: number | null = null;
    let accumulatedTime = 0;
    let active = false;
    let visible = typeof IntersectionObserver === "undefined";
    let alive = true;
    let failed = false;
    let px = -9999;
    let py = -9999;
    let shockX = -9999;
    let shockY = -9999;
    let shockStart = Number.NEGATIVE_INFINITY;
    let shockPending = false;
    let previousRing = -1;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let inkTop = 140;
    let restingBottom = DESIGN_HEIGHT;
    const motionEnabled = () => interactive;
    const applyArtworkTransform = () => {
      // Buffer rounding is undone by the canvas's CSS size. The effective CSS
      // transform is strictly uniform even at fractional DPRs (native zoom).
      const rx = canvas.width / width;
      const ry = canvas.height / heightPx;
      ctx.setTransform(
        rx * scale,
        0,
        0,
        ry * scale,
        rx * offsetX,
        ry * offsetY,
      );
    };
    const mapPointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || !scale) return;
      px = ((clientX - rect.left) * (width / rect.width) - offsetX) / scale;
      py = ((clientY - rect.top) * (heightPx / rect.height) - offsetY) / scale;
    };
    // Called once after the font settles, never by ResizeObserver or DPR changes.
    const buildArtwork = () => {
      if (canonicalArtwork) {
        inkTop = astraArtwork.inkTop;
        restingBottom = astraArtwork.restingBottom;
        dots = new Float32Array(
          astraArtwork.particles.flatMap(([x = 0, y = 0, r = 0]) => [
            x,
            y,
            0,
            0,
            x,
            y,
            r,
          ]),
        );
        return;
      }
      mask.width = DESIGN_WIDTH;
      mask.height = DESIGN_HEIGHT;
      maskCtx.textAlign = "left";
      maskCtx.textBaseline = "alphabetic";
      maskCtx.font = `${fontWeight} 100px ${fontFamily}`;
      const size = hwfFitSize(
        maskCtx.measureText(wordmark).width,
        DESIGN_WIDTH * 0.98,
      );
      maskCtx.font = `${fontWeight} ${size}px ${fontFamily}`;
      const metrics = maskCtx.measureText(wordmark);
      const ascent = metrics.actualBoundingBoxAscent;
      const descent = metrics.actualBoundingBoxDescent;
      const inkWidth =
        metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
      const inkHeight = ascent + descent;
      // Keep the complete ink bounds, including punctuation, centered. Zero
      // descent is legitimate for capitals; do not substitute a fake descender.
      inkTop = (DESIGN_HEIGHT - inkHeight) / 2;
      const inkLeft = (DESIGN_WIDTH - inkWidth) / 2;
      maskCtx.fillStyle = "white";
      maskCtx.fillText(
        wordmark,
        inkLeft + metrics.actualBoundingBoxLeft,
        inkTop + ascent,
      );
      const data = maskCtx.getImageData(0, 0, mask.width, mask.height).data;
      const cells: number[] = [];
      // Bound candidate cells once in design space. A viewport can never select
      // a different density/quality mode or increase this particle budget.
      const area = Math.max(1, (inkWidth + 12) * (inkHeight + 12));
      let gap = Math.max(3, dotGap, Math.sqrt(area / MAX_PARTICLES));
      while (
        Math.ceil(inkWidth / gap + 3) * Math.ceil(inkHeight / gap + 3) >
        MAX_PARTICLES
      )
        gap *= 1.01;
      for (
        let y = Math.max(0, Math.floor(inkTop) - gap);
        y < Math.min(DESIGN_HEIGHT, inkTop + inkHeight + gap);
        y += gap
      )
        for (
          let x = Math.max(0, Math.floor(inkLeft) - gap);
          x < Math.min(DESIGN_WIDTH, inkLeft + inkWidth + gap);
          x += gap
        ) {
          let coverage = 0;
          for (let sy = 0; sy < 3; sy++)
            for (let sx = 0; sx < 3; sx++) {
              const ix = Math.min(
                mask.width - 1,
                Math.floor(x + ((sx + 0.5) * gap) / 3),
              );
              const iy = Math.min(
                mask.height - 1,
                Math.floor(y + ((sy + 0.5) * gap) / 3),
              );
              coverage += (data[(iy * mask.width + ix) * 4 + 3] ?? 0) / 255;
            }
          coverage /= 9;
          if (coverage > 0.04)
            cells.push(
              x + gap / 2,
              y + gap / 2,
              0,
              0,
              x + gap / 2,
              y + gap / 2,
              hwfRadius(coverage, gap),
            );
        }
      dots = new Float32Array(cells);
      restingBottom = 0;
      for (let i = 0; i < dots.length; i += 7)
        restingBottom = Math.max(
          restingBottom,
          (dots[i + 5] ?? 0) + (dots[i + 6] ?? 0),
        );
    };
    const resize = () => {
      if (!dots.length) return;
      const nextWidth = root.getBoundingClientRect().width;
      if (nextWidth <= 0) {
        delete root.dataset.canvasReady;
        return;
      }
      const nextScale = Math.min(1, nextWidth / DESIGN_WIDTH) * artworkScale;
      const rule = root.querySelector<HTMLElement>(".hwf-rule");
      const artworkSpace =
        root.querySelector<HTMLElement>(".hwf-artwork-space");
      const layout = root.querySelector<HTMLElement>(".hwf-layout");
      const contentBottom = utilityBelowArtwork
        ? (layout?.offsetTop ?? 0) + (layout?.offsetHeight ?? 0)
        : rule
          ? rule.offsetTop + rule.offsetHeight
          : 0;
      // Keep the footer's top in normal document flow. Only extend its own
      // region when wrapped footer content would otherwise overlap the ink.
      const nextHeight = Math.ceil(
        utilityBelowArtwork
          ? contentBottom
          : contentBottom + 16 + (restingBottom - inkTop) * nextScale,
      );
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        Math.sqrt(MAX_BUFFER_PIXELS / (nextWidth * nextHeight)),
      );
      const bufferWidth = Math.max(1, Math.round(nextWidth * ratio));
      const bufferHeight = Math.max(1, Math.round(nextHeight * ratio));
      if (
        width === nextWidth &&
        heightPx === nextHeight &&
        canvas.width === bufferWidth &&
        canvas.height === bufferHeight
      )
        return;
      // A saved clientX/clientY belongs to the previous CSS coordinate system
      // after native zoom. Release that input, not the moving particles. The
      // next real pointer event maps through the new rendered rectangle.
      if (width !== nextWidth || heightPx !== nextHeight) px = py = -9999;
      width = nextWidth;
      heightPx = nextHeight;
      scale = nextScale;
      offsetX = (width - DESIGN_WIDTH * scale) / 2;
      // Align the visible resting dots, not the empty canonical region below
      // them. Keep the approved container dimensions and uniform scale intact.
      offsetY =
        utilityBelowArtwork && artworkSpace
          ? artworkSpace.offsetTop + 16 - inkTop * scale
          : heightPx - 1 - restingBottom * scale;
      if (utilityBelowArtwork && rule) {
        const ruleStyle = getComputedStyle(rule);
        root.style.setProperty(
          "--hwf-fallback-bottom",
          `${rule.offsetHeight + Number.parseFloat(ruleStyle.marginTop) + 1}px`,
        );
      }
      root.style.height = `${heightPx}px`;
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
      // Paint without advancing physics: resizing cannot reset or kick a spring.
      draw(performance.now(), 0);
      if (active) wake();
    };
    const paint = (time: number, steps = 1) => {
      if (!width || !heightPx) return;
      const canAnimate = motionEnabled();
      const floor = (heightPx - offsetY) / scale;
      ctx.setTransform(
        canvas.width / width,
        0,
        0,
        canvas.height / heightPx,
        0,
        0,
      );
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, heightPx);
      applyArtworkTransform();
      const [ir, ig, ib] = hwfHex(colors.ink) ?? [0, 0, 0];
      const [wr, wg, wb] = hwfHex(colors.warm) ?? [255, 255, 255];
      if (steps > 0 && canAnimate && shockPending) {
        // Start the existing wave when it can actually be painted. A quick
        // touch must not expire while the first RAF is delayed by busy work.
        shockStart = time;
        shockPending = false;
      }
      const elapsed = time - shockStart;
      const ring =
        elapsed >= 0 && elapsed < 900
          ? (elapsed / 900) * Math.hypot(DESIGN_WIDTH, DESIGN_HEIGHT)
          : -1;
      let changing = false;
      let displaced = false;
      for (let i = 0; i < dots.length; i += 7) {
        const x = dots[i] ?? 0;
        const y = dots[i + 1] ?? 0;
        const vx = dots[i + 2] ?? 0;
        const vy = dots[i + 3] ?? 0;
        const hx = dots[i + 4] ?? 0;
        const hy = dots[i + 5] ?? 0;
        const dotRadius = dots[i + 6] ?? 0;
        let nx = x;
        let ny = y;
        let nvx = vx;
        let nvy = vy;
        if (steps > 0 && canAnimate) {
          for (let step = 0; step < steps; step++)
            [nx, ny, nvx, nvy] = hwfStep(
              nx,
              ny,
              nvx,
              nvy,
              hx,
              hy,
              px,
              py,
              radius,
            );
          if (ring >= 0) {
            const dx = x - shockX;
            const dy = y - shockY;
            const distance = Math.hypot(dx, dy);
            if (distance > previousRing && distance <= ring && distance > 0) {
              const impulse = 2.6;
              nvx += (dx / distance) * impulse;
              nvy += (dy / distance) * impulse;
            }
          }
        } else if (!canAnimate) {
          nx = hx;
          ny = hy;
          nvx = nvy = 0;
        }
        // The artwork rests on a physical page edge. Cancel only velocity into
        // that surface so lower particles spread/return instead of disappearing
        // below the canvas. Tangential motion and the original spring remain.
        if (ny + dotRadius > floor) {
          ny = floor - dotRadius;
          nvy = Math.min(0, nvy);
        }
        if (
          Math.abs(nvx) + Math.abs(nvy) < 0.02 &&
          Math.abs(nx - hx) + Math.abs(ny - hy) < 0.05
        ) {
          nx = hx;
          ny = hy;
          nvx = 0;
          nvy = 0;
        }
        dots[i] = nx;
        dots[i + 1] = ny;
        dots[i + 2] = nvx;
        dots[i + 3] = nvy;
        if (
          Math.abs(nx - x) +
            Math.abs(ny - y) +
            Math.abs(nvx) +
            Math.abs(nvy) +
            Math.abs(nvx - vx) +
            Math.abs(nvy - vy) >=
          0.02
        )
          changing = true;
        if (Math.abs(nx - hx) + Math.abs(ny - hy) >= 0.05) displaced = true;
        const warmth = hwfWarmth(nx, ny, hx, hy, 28);
        const r = Math.round((ir ?? 0) + ((wr ?? 0) - (ir ?? 0)) * warmth);
        const g = Math.round((ig ?? 0) + ((wg ?? 0) - (ig ?? 0)) * warmth);
        const b = Math.round((ib ?? 0) + ((wb ?? 0) - (ib ?? 0)) * warmth);
        ctx.beginPath();
        ctx.arc(nx, ny, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
      }
      if (grain > 0) {
        ctx.setTransform(
          canvas.width / width,
          0,
          0,
          canvas.height / heightPx,
          0,
          0,
        );
        ctx.globalAlpha = Math.min(0.18, grain * 0.12);
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle =
          ctx.createPattern(grainCanvas, "repeat") || "transparent";
        ctx.fillRect(0, 0, width, heightPx);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        applyArtworkTransform();
      }
      active =
        visible &&
        !document.hidden &&
        canAnimate &&
        // A spring briefly has near-zero velocity at its turning point. Keep
        // restoring displaced dots after pointer exit rather than freezing there.
        (changing ||
          (px === -9999 && displaced) ||
          (elapsed >= 0 && elapsed < 900));
      if (steps > 0) previousRing = ring;
    };
    const fail = () => {
      failed = true;
      active = false;
      delete root.dataset.canvasReady;
      // The SVG must keep responding to viewport/content changes even when
      // canvas layout has stopped. Do not retain its last measured pixel height.
      if (canonicalArtwork) root.style.height = "auto";
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const draw = (time: number, steps = 1) => {
      if (failed || !width || !heightPx || !dots.length) return;
      try {
        paint(time, steps);
        if (ctx.isContextLost()) {
          fail();
          return;
        }
        // All arcs have been painted synchronously. Swap layers atomically;
        // never expose the default 300x150 or a cleared/partial canvas.
        root.dataset.canvasReady = "true";
      } catch {
        fail();
      }
    };
    const layout = () => {
      if (failed) return;
      try {
        resize();
      } catch {
        fail();
      }
    };
    const loop = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || !motionEnabled()) return;
      // Preserve the original 60Hz spring coefficients at any display refresh
      // rate. Bound catch-up after a stall; resize redraws never consume time.
      accumulatedTime +=
        lastFrameTime === null
          ? PHYSICS_STEP_MS
          : Math.max(0, Math.min(time - lastFrameTime, PHYSICS_STEP_MS * 4));
      lastFrameTime = time;
      const steps = Math.floor((accumulatedTime + 0.001) / PHYSICS_STEP_MS);
      if (steps > 0) {
        accumulatedTime = Math.max(
          0,
          accumulatedTime - steps * PHYSICS_STEP_MS,
        );
        draw(time, steps);
      }
      if (active) frame = requestAnimationFrame(loop);
    };
    function wake() {
      if (
        !frame &&
        !failed &&
        dots.length &&
        visible &&
        !document.hidden &&
        motionEnabled()
      ) {
        lastFrameTime = null;
        accumulatedTime = 0;
        frame = requestAnimationFrame(loop);
      }
    }
    const position = (event: PointerEvent) => {
      if (
        !motionEnabled() ||
        (event.pointerType === "touch" && event.type === "pointermove")
      )
        return;
      if ((event.target as Element).closest("a, button")) {
        leave();
        return;
      }
      mapPointer(event.clientX, event.clientY);
      if (interactive && visible) {
        active = true;
        wake();
      }
    };
    const impact = (event: PointerEvent) => {
      if (!motionEnabled()) return;
      if ((event.target as Element).closest("a, button")) return;
      position(event);
      if (interactive) {
        shockX = px;
        shockY = py;
        shockPending = true;
        previousRing = -1;
        active = true;
        wake();
      }
    };
    const leave = () => {
      px = py = -9999;
      active = visible && interactive;
      wake();
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(layout);
    resizeObserver?.observe(root);
    const top = root.querySelector(".hwf-top");
    if (top) resizeObserver?.observe(top);
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = Boolean(entry?.isIntersecting);
            active = visible && interactive;
            if (active) wake();
          });
    intersection?.observe(root);
    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        shockStart = Number.NEGATIVE_INFINITY;
        shockPending = false;
        wake();
      }
    };
    // A monitor/DPR change need not resize CSS dimensions. Re-arm the query at
    // the new density; it only refreshes the buffer, never the source artwork.
    let densityQuery: MediaQueryList;
    const onDensityChange = () => {
      densityQuery?.removeEventListener("change", onDensityChange);
      densityQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      densityQuery.addEventListener("change", onDensityChange);
      layout();
    };
    onDensityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", layout);
    root.addEventListener("pointermove", position);
    root.addEventListener("pointerdown", impact);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointercancel", leave);
    const releaseTouch = (event: PointerEvent) => {
      if (event.pointerType === "touch") leave();
    };
    root.addEventListener("pointerup", releaseTouch);
    canvas.addEventListener("contextlost", fail);
    const initialize = () => {
      if (!alive) return;
      try {
        buildArtwork();
        layout();
        wake();
      } catch {
        fail();
      }
    };
    // Font rasterization occurs exactly once per wordmark configuration, after
    // loading, rather than once before ready and again after every resize.
    if (canonicalArtwork) initialize();
    else
      document.fonts
        .load(`${fontWeight} 100px ${fontFamily}`, wordmark)
        .then(() => document.fonts.ready)
        .then(initialize, initialize);
    return () => {
      alive = false;
      delete root.dataset.canvasReady;
      densityQuery?.removeEventListener("change", onDensityChange);
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", layout);
      root.removeEventListener("pointermove", position);
      root.removeEventListener("pointerdown", impact);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointercancel", leave);
      root.removeEventListener("pointerup", releaseTouch);
      canvas.removeEventListener("contextlost", fail);
    };
  }, [
    wordmark,
    dotGap,
    radius,
    grain,
    interactive,
    artworkScale,
    fontFamily,
    fontWeight,
    colors.ink,
    colors.warm,
    colors.background,
    canonicalArtwork,
    utilityBelowArtwork,
  ]);

  return (
    <footer
      ref={rootRef}
      data-testid="programs-footer"
      className={`hwf-root${canonicalArtwork ? " hwf-canonical" : ""} ${className}`}
      style={
        {
          "--hwf-bg": colors.background,
          "--hwf-ink": colors.ink,
          "--hwf-mono": monoFamily,
          "--hwf-artwork-scale": artworkScale,
          // Initial/no-JS region only. Layout sizes its own contents after load.
          height: canonicalArtwork ? "auto" : height,
          "--hwf-resting-bottom": astraArtwork.restingBottom,
          "--hwf-ink-top": astraArtwork.inkTop,
        } as React.CSSProperties
      }
    >
      <style>{HWF_CSS}</style>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: visual duplicate canvas has no interactive role or tabIndex */}
      <canvas ref={canvasRef} aria-hidden="true" />
      {canonicalArtwork && (
        <svg
          className="hwf-fallback"
          viewBox={`0 0 ${DESIGN_WIDTH} ${astraArtwork.restingBottom}`}
          aria-hidden="true"
          focusable="false"
        >
          <path d={ASTRA_DOTS_PATH} fill="currentColor" />
        </svg>
      )}
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-layout">
        {showTop && (
          <div className="hwf-top">
            {showBrand && (
              <div className="hwf-brand">
                {brandContent ?? (
                  <>
                    <strong>{label}</strong>
                    <span>{meta}</span>
                  </>
                )}
              </div>
            )}
            {columns.map((column) => (
              <nav
                className="hwf-col"
                key={column.title}
                aria-label={column.title}
              >
                <h2>{column.title}</h2>
                {column.links.map((link) =>
                  link.href ? (
                    link.href.startsWith("/") ? (
                      <Link key={link.label} href={link.href}>
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    )
                  ) : (
                    <span key={link.label}>{link.label}</span>
                  ),
                )}
              </nav>
            ))}
          </div>
        )}
        {canonicalArtwork && utilityBelowArtwork && (
          <div className="hwf-artwork-space" aria-hidden="true" />
        )}
        <div className="hwf-rule">
          {utility && <div className="hwf-utility">{utility}</div>}
        </div>
        {canonicalArtwork && !utilityBelowArtwork && (
          <div className="hwf-artwork-space" aria-hidden="true" />
        )}
      </div>
    </footer>
  );
}

export const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: var(--hwf-bg); color: var(--hwf-ink); -webkit-font-smoothing: antialiased;
}
.hwf-root canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; max-width: none; visibility: hidden; }
.hwf-root[data-canvas-ready="true"] canvas { visibility: visible; }
.hwf-root[data-canvas-ready="true"] .hwf-fallback { visibility: hidden; }
.hwf-canonical { container-type: inline-size; }
.hwf-artwork-space { height: calc(16px + (var(--hwf-resting-bottom) - var(--hwf-ink-top)) * min(100cqw, 1440px) / 1440); }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
  gap: 24px; padding: clamp(22px, 3.4vw, 40px) clamp(20px, 3.4vw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; line-height: 1.75;
}
.hwf-brand strong { display: block; font-weight: 500; }
.hwf-brand span { opacity: .65; }
.hwf-col h2 { margin: 0; font: inherit; opacity: .65; font-weight: 500; }
.hwf-col a { display: block; width: fit-content; }
.hwf-utility { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; min-width: 0; }
.hwf-utility p { margin: 0; color: #aeb4be; font: 500 clamp(12px, 1.1vw, 14px)/1.5 Inter, sans-serif; letter-spacing: -.01em; text-transform: none; }
.hwf-col a, .hwf-utility a {
  color: inherit; text-decoration: none; opacity: .78; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
.hwf-col a:hover, .hwf-utility a:hover { opacity: 1; background-size: 100% 1px; }
.hwf-col a:focus-visible, .hwf-utility a:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;
  margin: clamp(20px, 3.4vw, 44px) clamp(20px, 3.4vw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
}
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.hwf-fallback { position: absolute; bottom: var(--hwf-fallback-bottom, 1px); left: 50%; transform: translateX(-50%); width: min(100%, 1440px); height: auto; display: block; pointer-events: none; }
@media (max-width: 720px) {
  .hwf-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); row-gap: 18px; }
  .hwf-brand { grid-column: 1 / -1; }
  .hwf-rule { flex-direction: column; align-items: flex-start; }
  .hwf-utility { width: 100%; }
}
`;

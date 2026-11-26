"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  CREATION_RECIPE,
  heroArtworkFit,
  heroCellSize,
  pulseOpacity,
  sampleDitherCells,
  shimmerOpacity,
} from "@/lib/creation-dither";
import {
  getReducedMotion,
  subscribeReducedMotion,
} from "@/lib/motion-preference";
import { useCinematicDepth } from "./use-cinematic-depth";

export function CreationArtwork() {
  const rootRef = useRef<HTMLElement>(null);
  const mobileSourceRef = useRef<HTMLSourceElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atmosphereRef = useRef<HTMLCanvasElement>(null);
  useCinematicDepth(rootRef, "artwork");

  // Chromium keeps a MediaQueryList listener for <source media> while the
  // detached source remains active. Release it before React removes the page.
  useLayoutEffect(() => {
    const picture = rootRef.current?.querySelector("picture");
    const source = mobileSourceRef.current;
    // Strict Mode replays effect cleanup without removing the component.
    if (source && picture && source.parentNode !== picture)
      picture.prepend(source);
    return () => {
      source?.remove();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const atmosphere = atmosphereRef.current;
    if (!root || !canvas || !atmosphere) return;
    if (typeof Path2D === "undefined") return;
    const image = new Image();
    image.decoding = "async";
    const context = canvas.getContext("2d");
    if (!context) return;

    // Image sampling and primitive construction happen only on load/resize.
    // Each animation frame composites cached raster layers, never image data.
    const pixels = document.createElement("canvas");
    const backdrop = document.createElement("canvas");
    const light = document.createElement("canvas");
    const shimmerLayers = Array.from({ length: 6 }, () =>
      document.createElement("canvas"),
    );
    const pixelContext = pixels.getContext("2d");
    const backdropContext = backdrop.getContext("2d");
    const lightContext = light.getContext("2d");
    if (!pixelContext || !backdropContext || !lightContext) return;
    let width = 0;
    let height = 0;
    let lastSize = "";
    let frame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let ready = false;
    let visible = typeof IntersectionObserver === "undefined";
    const page =
      typeof MutationObserver === "undefined" ? null : root.closest("main");

    const paint = () => {
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = false;

      // Keep the same six phases, but rasterize the complex clip paths only
      // on resize. Scrolling then composites textures, not thousands of clips.
      const pulse = pulseOpacity(elapsed);
      for (const [group, layer] of shimmerLayers.entries()) {
        context.globalAlpha = pulse * shimmerOpacity(elapsed, group);
        context.drawImage(layer, 0, 0, width, height);
      }
      context.globalCompositeOperation = "source-over";

      // A broad, slow exposure pass is clipped to the *same* pixel silhouettes.
      // No blur, displacement or randomized occupancy reaches the foreground.
      const center =
        -0.15 + (0.5 - 0.5 * Math.cos((elapsed / 3200) * Math.PI * 2)) * 0.65;
      const gradient = lightContext.createLinearGradient(0, 0, width, 0);
      for (let i = 0; i <= 32; i++) {
        const x = i / 32;
        const glow = Math.min(
          0.7,
          0.55 *
            (Math.exp(-(((x - center) / 0.14) ** 2)) +
              Math.exp(-(((x - (1 - center)) / 0.14) ** 2))),
        );
        gradient.addColorStop(x, `rgba(245,248,255,${glow})`);
      }
      lightContext.globalCompositeOperation = "source-over";
      lightContext.clearRect(0, 0, width, height);
      lightContext.drawImage(pixels, 0, 0, width, height);
      lightContext.globalCompositeOperation = "source-in";
      lightContext.fillStyle = gradient;
      lightContext.fillRect(0, 0, width, height);
      context.globalAlpha = 1;
      context.drawImage(light, 0, 0, width, height);
    };

    const tick = (time: number) => {
      frame = 0;
      if (
        !visible ||
        document.hidden ||
        page?.inert ||
        !ready ||
        getReducedMotion()
      )
        return;
      if (!previousTime) previousTime = time;
      if (time - previousTime >= 1000 / 30) {
        elapsed += time - previousTime;
        previousTime = time;
        paint();
      }
      frame = requestAnimationFrame(tick);
    };
    const syncAnimation = () => {
      if (
        !visible ||
        document.hidden ||
        page?.inert ||
        !ready ||
        getReducedMotion()
      ) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    };

    const rebuild = () => {
      if (!image.complete || !image.naturalWidth) return;
      width = Math.round(root.clientWidth);
      height = Math.round(root.clientHeight);
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Cap backing buffer to avoid excessive memory at large viewport sizes
      const maxDimension = 2048;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const bufferWidth = Math.round(width * dpr * scale);
      const bufferHeight = Math.round(height * dpr * scale);
      const size = `${bufferWidth}:${bufferHeight}:${dpr}:${scale}`;
      if (size === lastSize) return;
      lastSize = size;
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
      context.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      context.imageSmoothingEnabled = false;
      for (const layer of [pixels, light, atmosphere]) {
        layer.width = bufferWidth;
        layer.height = bufferHeight;
      }
      pixelContext.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      lightContext.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

      const sample = document.createElement("canvas");
      sample.width = width;
      sample.height = height;
      const source = sample.getContext("2d", { willReadFrequently: true });
      if (!source) return;
      const fit = heroArtworkFit(
        image.naturalWidth,
        image.naturalHeight,
        width,
        height,
      );
      source.drawImage(
        image,
        fit.sx,
        fit.sy,
        fit.sw,
        fit.sh,
        fit.x * scale,
        fit.y * scale,
        fit.width * scale,
        fit.height * scale,
      );
      const cellSize = heroCellSize(width);
      const cells = sampleDitherCells(
        source.getImageData(0, 0, width * scale, height * scale).data,
        Math.round(width * scale),
        Math.round(height * scale),
        cellSize * scale,
      );

      // Background is preblurred at quarter resolution. Low exposure is an
      // intentional ASTRA adaptation; recipe bg opacity remains 100%.
      backdrop.width = Math.max(1, Math.round((width * scale) / 4));
      backdrop.height = Math.max(1, Math.round((height * scale) / 4));
      backdropContext.filter = `blur(${(CREATION_RECIPE.bgBlur * width * scale) / 1080 / 4}px) brightness(0.13)`;
      backdropContext.globalAlpha = CREATION_RECIPE.bgOpacity / 100;
      backdropContext.drawImage(
        image,
        fit.sx,
        fit.sy,
        fit.sw,
        fit.sh,
        (fit.x * scale) / 4,
        (fit.y * scale) / 4,
        (fit.width * scale) / 4,
        (fit.height * scale) / 4,
      );

      atmosphere
        .getContext("2d")
        ?.drawImage(backdrop, 0, 0, atmosphere.width, atmosphere.height);

      const shimmerGroups = shimmerLayers.map(() => new Path2D());

      for (const cell of cells) {
        const { x, y, luminance, alpha, threshold } = cell;
        // Cells are in scaled coordinate space (width*scale, height*scale).
        // Convert to CSS pixel space for drawing with context transform (dpr*scale).
        const cssX = x / scale;
        const cssY = y / scale;
        const cssCellSize = cellSize;
        // Ordered, source-derived occupancy. Density shapes the stipple; coverage
        // is 100% of sampled cells. No stochastic selection or frame noise.
        const tone = luminance ** 0.85;
        const lit = tone > threshold / (0.8 + CREATION_RECIPE.density / 100);
        const size = lit
          ? cssCellSize * (0.42 + tone * 0.36)
          : cssCellSize * 0.24;
        const edgeFade = Math.min(
          1,
          cssX / (width * (width < 700 ? 0.025 : 0.06)),
          (width - cssX) / (width * (width < 700 ? 0.025 : 0.06)),
        );
        pixelContext.globalAlpha =
          alpha * edgeFade * (lit ? 0.56 + tone * 0.44 : 0.24 + tone * 0.24);
        // Rare deterministic blue flecks, not a blue tint over the source.
        const blue =
          lit &&
          ((cssX / cssCellSize) * 17 + (cssY / cssCellSize) * 29) % 103 === 0;
        pixelContext.fillStyle = lit
          ? blue
            ? "#619bc6"
            : "#edf2f8"
          : "#5e6672";
        const square = Math.max(1, Math.round(size * dpr));
        const px = Math.round((cssX + (cssCellSize - size) / 2) * dpr) / dpr;
        const py = Math.round((cssY + (cssCellSize - size) / 2) * dpr) / dpr;
        pixelContext.fillRect(px, py, square / dpr, square / dpr);
        {
          const group =
            (Math.floor(cssX / (cssCellSize * 7)) * 3 +
              Math.floor(cssY / (cssCellSize * 5)) * 5) %
            6;
          shimmerGroups[group]?.rect(px, py, square / dpr, square / dpr);
        }
      }
      pixelContext.globalAlpha = 1;
      for (const [group, layer] of shimmerLayers.entries()) {
        const path = shimmerGroups[group];
        if (!path) continue;
        layer.width = bufferWidth;
        layer.height = bufferHeight;
        const context = layer.getContext("2d");
        if (!context) continue;
        context.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
        context.imageSmoothingEnabled = false;
        context.clip(path);
        context.drawImage(pixels, 0, 0, width, height);
      }
      ready = true;
      paint();
      root.dataset.ready = "true";
      syncAnimation();
    };

    image.addEventListener("load", rebuild);
    image.src = "/images/creation-of-adam-hands.webp";
    rebuild();
    const visibility =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            syncAnimation();
          });
    visibility?.observe(root);
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(rebuild);
    resize?.observe(root);
    window.addEventListener("resize", rebuild);
    document.addEventListener("visibilitychange", syncAnimation);
    const unsubscribeMotion = subscribeReducedMotion(syncAnimation);
    // Kinetic navigation already marks the covered page inert. Reuse that
    // existing signal so artwork doesn't compete with an opaque menu animation.
    const occlusion = page ? new MutationObserver(syncAnimation) : null;
    if (page)
      occlusion?.observe(page, {
        attributes: true,
        attributeFilter: ["inert"],
      });
    return () => {
      cancelAnimationFrame(frame);
      image.removeEventListener("load", rebuild);
      resize?.disconnect();
      visibility?.disconnect();
      occlusion?.disconnect();
      window.removeEventListener("resize", rebuild);
      document.removeEventListener("visibilitychange", syncAnimation);
      unsubscribeMotion();
      delete root.dataset.ready;
    };
  }, []);

  return (
    <figure
      ref={rootRef}
      className="creation-artwork"
      aria-label="Two silver, dithered hands reach toward one another, with a small space between their fingertips. After Michelangelo's Creation of Adam."
    >
      <canvas
        ref={atmosphereRef}
        className="creation-atmosphere"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="creation-subject-depth">
        <picture>
          <source
            ref={mobileSourceRef}
            media="(max-width: 700px)"
            srcSet="/images/creation-dither-mobile.webp"
          />
          <img
            src="/images/creation-dither-desktop.webp"
            width="1400"
            height="640"
            alt="Two silver dither hands reaching toward each other"
            fetchPriority="high"
            className="creation-artwork-fallback"
          />
        </picture>
        <canvas
          ref={canvasRef}
          className="creation-subject"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </figure>
  );
}

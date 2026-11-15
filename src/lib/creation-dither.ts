// Only the active 21st.dev recipe is implemented. There is no editor or unused
// render-mode dispatch. Full user parameters are recorded in the design brief.
export const CREATION_RECIPE = {
  renderMode: "dither",
  cellSize: 9,
  density: 20,
  coverage: 100,
  contrast: 158,
  brightness: 0,
  saturation: 100,
  grayscale: 0,
  tint: "#3ca6ff",
  tintOpacity: 0,
  bgMode: "blur",
  bgBlur: 60,
  bgOpacity: 100,
  blurType: "off",
  animated: true,
  animStyle: "pulse",
  animSpeed: 100,
  animIntensity: 60,
} as const;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export interface DitherCell {
  x: number;
  y: number;
  luminance: number;
  alpha: number;
  threshold: number;
}

export function ditherThreshold(x: number, y: number) {
  return ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16;
}

export function sampleDitherCells(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cellSize: number,
): DitherCell[] {
  const cells: DitherCell[] = [];
  const step = Math.max(1, Math.round(cellSize));
  // CSS contrast(158%) semantics: scale around middle grey, after brightness.
  const contrast = CREATION_RECIPE.contrast / 100;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let luminance = 0;
      let alpha = 0;
      let count = 0;
      for (let py = y; py < Math.min(y + step, height); py++) {
        for (let px = x; px < Math.min(x + step, width); px++) {
          const index = (py * width + px) * 4;
          const opacity = (data[index + 3] ?? 0) / 255;
          luminance +=
            ((0.2126 * (data[index] ?? 0) +
              0.7152 * (data[index + 1] ?? 0) +
              0.0722 * (data[index + 2] ?? 0)) /
              255) *
            opacity;
          alpha += opacity;
          count++;
        }
      }
      if (alpha === 0) continue;
      cells.push({
        x,
        y,
        luminance: clamp((luminance / alpha - 0.5) * contrast + 0.5),
        alpha: alpha / count,
        threshold: ditherThreshold(x / step, y / step),
      });
    }
  }
  return cells;
}

export function containArtwork(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const fittedWidth = sourceWidth * scale;
  const fittedHeight = sourceHeight * scale;
  return {
    x: (width - fittedWidth) / 2,
    y: (height - fittedHeight) / 2,
    width: fittedWidth,
    height: fittedHeight,
  };
}

// The hero uses finer cells than the original nine-pixel recipe. Keep a floor
// on phones rather than losing the source to a handful of oversized squares.
export function heroCellSize(width: number) {
  return Math.max(2, Math.min(4, Math.round(width / 360)));
}

export function heroArtworkFit(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  // Mobile trims only the outer forearms. All fingers, both palms and the
  // original fingertip gap stay in the source's original relative positions.
  const crop = width < 700 ? 0.68 : 1;
  const sw = Math.round(sourceWidth * crop);
  return {
    sx: (sourceWidth - sw) / 2,
    sy: 0,
    sw,
    sh: sourceHeight,
    ...containArtwork(sw, sourceHeight, width, height),
  };
}

export function shimmerOpacity(time: number, group: number) {
  const phase = group * 1.37;
  return (
    0.76 +
    0.22 * Math.sin((time / 3200) * Math.PI * 2 + phase) +
    0.02 * Math.sin(time / 1100 + phase * 1.7)
  );
}

export function pulseOpacity(time: number) {
  const depth = (CREATION_RECIPE.animIntensity / 100) * 0.25;
  const speed = CREATION_RECIPE.animSpeed / 100;
  return 1 - depth + depth * Math.sin(((time * speed) / 3200) * Math.PI * 2);
}

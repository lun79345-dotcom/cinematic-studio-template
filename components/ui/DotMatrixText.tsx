"use client";

import { useEffect, useRef } from "react";

export type DotMatrixOrientation =
  | "horizontal"
  | "vertical"
  | "vertical-up"
  | "vertical-down";

export type DotMatrixTextProps = {
  text: string;
  /** Use the existing particle grid as a solid rectangular mask instead of lettering. */
  maskShape?: "text" | "solid";
  /** Optional deterministic variation key for multiple instances with the same content. */
  seedKey?: string;
  orientation?: DotMatrixOrientation;
  fontFamily?: string;
  fontWeight?: number | string;
  /** Scale applied after responsive fitting. */
  fontScale?: number;
  dotSize?: number;
  gap?: number;
  /** Extra spacing between upright vertical glyphs, measured in em. */
  characterSpacing?: number;
  accentColor?: string;
  baseColor?: string;
  backgroundColor?: string;
  accentDensity?: number;
  /** Duration, in milliseconds, of one accent transition cycle. */
  speed?: number;
  animate?: boolean;
  className?: string;
  ariaLabel?: string;
};

type Dot = {
  x: number;
  y: number;
  key: number;
  phase: number;
  rate: number;
};

const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hashUnit(seed: number, key: number, epoch: number) {
  let value =
    seed ^
    Math.imul(key + 1, 0x9e3779b1) ^
    Math.imul(epoch + 1, 0x85ebca6b);

  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;

  return (value >>> 0) / 4294967296;
}

function smootherStep(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function resolveColor(color: string, canvas: HTMLCanvasElement) {
  if (!color.includes("var(")) return color;

  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.display = "none";
  canvas.parentElement?.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  return resolved || color;
}

function resolveFontFamily(fontFamily: string, canvas: HTMLCanvasElement) {
  if (!fontFamily.includes("var(")) return fontFamily;

  const probe = document.createElement("span");
  probe.style.fontFamily = fontFamily;
  probe.style.display = "none";
  canvas.parentElement?.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  probe.remove();

  return resolved || fontFamily;
}

/**
 * Responsive Canvas 2D dot-matrix lettering with deterministic gold twinkles.
 * Give the canvas an explicit height through `className` or its parent layout.
 */
export function DotMatrixText({
  text,
  maskShape = "text",
  seedKey = "",
  orientation = "horizontal",
  fontFamily = 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
  fontWeight = 700,
  fontScale = 1,
  dotSize = 4,
  gap = 3,
  characterSpacing = 0.18,
  accentColor = "#debd87",
  baseColor = "rgba(222, 189, 135, 0.13)",
  backgroundColor = "transparent",
  accentDensity = 0.1,
  speed = 1100,
  animate = true,
  className,
  ariaLabel,
}: DotMatrixTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const safeDotSize = Math.max(1, finiteOr(dotSize, 4));
    const safeGap = Math.max(0, finiteOr(gap, 3));
    const safeFontScale = clamp(finiteOr(fontScale, 1), 0.1, 2);
    const safeCharacterSpacing = Math.max(
      0,
      finiteOr(characterSpacing, 0.18),
    );
    const pitch = safeDotSize + safeGap;
    const density = clamp(finiteOr(accentDensity, 0.1), 0, 1);
    const cycleDuration = Math.max(120, finiteOr(speed, 1100));
    const resolvedFontFamily = resolveFontFamily(fontFamily, canvas);
    const seed = hashString(
      `${text}|${maskShape}|${seedKey}|${orientation}|${resolvedFontFamily}|${String(fontWeight)}|${safeFontScale}|${safeDotSize}|${safeGap}|${safeCharacterSpacing}`,
    );
    const colors = {
      accent: resolveColor(accentColor, canvas),
      base: resolveColor(baseColor, canvas),
      background: resolveColor(backgroundColor, canvas),
    };

    let dots: Dot[] = [];
    let cssWidth = 0;
    let cssHeight = 0;
    let pixelRatio = 1;
    let elapsed = 0;
    let lastFrameTime = 0;
    let animationFrame = 0;
    let rebuildFrame = 0;
    let fontsReady = !("fonts" in document);
    let isIntersecting = typeof IntersectionObserver === "undefined";
    let isDocumentVisible = !document.hidden;
    let reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let destroyed = false;

    const shouldAnimate = () =>
      animate && !reduceMotion && isIntersecting && isDocumentVisible;

    const paint = (animationTime: number, staticAccents = false) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);

      if (colors.background !== "transparent") {
        context.globalAlpha = 1;
        context.fillStyle = colors.background;
        context.fillRect(0, 0, cssWidth, cssHeight);
      }

      context.globalAlpha = 1;
      context.fillStyle = colors.base;
      for (const dot of dots) {
        context.fillRect(dot.x, dot.y, safeDotSize, safeDotSize);
      }

      context.fillStyle = colors.accent;
      for (const dot of dots) {
        let opacity = 0;

        if (staticAccents) {
          if (hashUnit(seed, dot.key, 0) < density) {
            opacity = 0.78 + hashUnit(seed, dot.key, 17) * 0.22;
          }
        } else {
          const localTime = animationTime + dot.phase * cycleDuration;
          const epoch = Math.floor(localTime / cycleDuration);
          const progress = (localTime % cycleDuration) / cycleDuration;
          const from = hashUnit(seed, dot.key, epoch) < density ? 1 : 0;
          const to = hashUnit(seed, dot.key, epoch + 1) < density ? 1 : 0;
          const blend = smootherStep(progress);
          const selection = from + (to - from) * blend;
          const twinkle =
            0.68 +
            0.32 *
              (0.5 +
                0.5 *
                  Math.sin(
                    (localTime / cycleDuration) * TAU * dot.rate +
                      dot.phase * TAU,
                  ));
          opacity = selection * twinkle;
        }

        if (opacity <= 0.008) continue;
        context.globalAlpha = opacity;
        context.fillRect(dot.x, dot.y, safeDotSize, safeDotSize);
      }

      context.globalAlpha = 1;
    };

    const stopAnimation = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrameTime = 0;
    };

    const tick = (time: number) => {
      animationFrame = 0;
      if (!shouldAnimate() || destroyed) return;

      if (lastFrameTime !== 0) {
        elapsed += Math.min(time - lastFrameTime, 50);
      }
      lastFrameTime = time;
      paint(elapsed);
      animationFrame = requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (animationFrame || !shouldAnimate() || destroyed) return;
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(tick);
    };

    const syncAnimation = () => {
      if (shouldAnimate()) {
        startAnimation();
        return;
      }

      stopAnimation();
      paint(0, true);
    };

    const fontAt = (size: number) =>
      `${String(fontWeight)} ${size}px ${resolvedFontFamily}`;

    const rebuild = () => {
      rebuildFrame = 0;
      if (destroyed || !fontsReady) return;

      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.round(bounds.width));
      const nextHeight = Math.max(0, Math.round(bounds.height));

      if (nextWidth === 0 || nextHeight === 0) {
        dots = [];
        cssWidth = nextWidth;
        cssHeight = nextHeight;
        return;
      }

      cssWidth = nextWidth;
      cssHeight = nextHeight;
      pixelRatio = clamp(window.devicePixelRatio || 1, 1, 3);
      canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
      canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));

      const mask = document.createElement("canvas");
      mask.width = canvas.width;
      mask.height = canvas.height;
      const maskContext = mask.getContext("2d", { willReadFrequently: true });

      if (!maskContext || (maskShape === "text" && !text.trim())) {
        dots = [];
        paint(0, true);
        return;
      }

      maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      maskContext.clearRect(0, 0, cssWidth, cssHeight);
      maskContext.fillStyle = "#ffffff";

      if (maskShape === "solid") {
        maskContext.fillRect(0, 0, cssWidth, cssHeight);
      } else {
        maskContext.textAlign = "left";
        maskContext.textBaseline = "alphabetic";

        const padding = pitch * 1.5;
        const isVertical = orientation !== "horizontal";
        const isUprightVertical = orientation === "vertical";
        const availableLength = Math.max(
          1,
          (isVertical ? cssHeight : cssWidth) - padding * 2,
        );
        const availableThickness = Math.max(
          1,
          (isVertical ? cssWidth : cssHeight) - padding * 2,
        );
        const targetLength = availableLength * safeFontScale;
        const targetThickness = availableThickness * safeFontScale;

        const glyphs = Array.from(text);
        const measureGlyph = (value: string, fontSize: number) => {
          maskContext.font = fontAt(fontSize);
          const metrics = maskContext.measureText(value);
          const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
          const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
          const left = metrics.actualBoundingBoxLeft || 0;
          const right = metrics.actualBoundingBoxRight || metrics.width;

          return {
            width: Math.max(1, left + right),
            height: Math.max(1, ascent + descent),
            ascent,
            descent,
            left,
          };
        };

        const measure = (fontSize: number) => {
          if (!isUprightVertical) {
            return {
              ...measureGlyph(text, fontSize),
              gap: 0,
              glyphMetrics: [] as ReturnType<typeof measureGlyph>[],
              lineHeight: 0,
            };
          }

          const glyphMetrics = glyphs.map((glyph) =>
            measureGlyph(glyph, fontSize),
          );
          const width = Math.max(
            1,
            ...glyphMetrics.map((metrics) => metrics.width),
          );
          const lineHeight = Math.max(
            fontSize,
            ...glyphMetrics.map((metrics) => metrics.height),
          );
          const characterGap = fontSize * safeCharacterSpacing;
          const height =
            lineHeight * glyphMetrics.length +
            characterGap * Math.max(0, glyphMetrics.length - 1);

          return {
            width,
            height: Math.max(1, height),
            ascent: 0,
            descent: 0,
            left: 0,
            gap: characterGap,
            glyphMetrics,
            lineHeight,
          };
        };

        let low = 1;
        let high = Math.max(2, targetThickness * 1.5);
        for (let iteration = 0; iteration < 16; iteration += 1) {
          const candidate = (low + high) / 2;
          const measured = measure(candidate);
          const fits = isUprightVertical
            ? measured.height <= targetLength &&
              measured.width <= targetThickness
            : measured.width <= targetLength &&
              measured.height <= targetThickness;

          if (fits) {
            low = candidate;
          } else {
            high = candidate;
          }
        }

        const fitted = measure(low);
        maskContext.font = fontAt(low);
        maskContext.save();
        maskContext.translate(cssWidth / 2, cssHeight / 2);

        if (isUprightVertical) {
          const startY = -fitted.height / 2;

          glyphs.forEach((glyph, index) => {
            const metrics = fitted.glyphMetrics[index];
            if (!metrics) return;

            const centerY =
              startY +
              fitted.lineHeight / 2 +
              index * (fitted.lineHeight + fitted.gap);
            const originX = -metrics.width / 2 + metrics.left;
            const baselineY =
              centerY + (metrics.ascent - metrics.descent) / 2;
            maskContext.fillText(glyph, originX, baselineY);
          });
        } else {
          if (orientation === "vertical-up") maskContext.rotate(-Math.PI / 2);
          if (orientation === "vertical-down") maskContext.rotate(Math.PI / 2);
          const originX = -fitted.width / 2 + fitted.left;
          const baselineY = (fitted.ascent - fitted.descent) / 2;
          maskContext.fillText(text, originX, baselineY);
        }

        maskContext.restore();
      }

      const pixels = maskContext.getImageData(
        0,
        0,
        mask.width,
        mask.height,
      ).data;
      const columns = Math.max(0, Math.floor((cssWidth + safeGap) / pitch));
      const rows = Math.max(0, Math.floor((cssHeight + safeGap) / pitch));
      const gridWidth =
        columns > 0 ? columns * safeDotSize + (columns - 1) * safeGap : 0;
      const gridHeight =
        rows > 0 ? rows * safeDotSize + (rows - 1) * safeGap : 0;
      const offsetX = (cssWidth - gridWidth) / 2;
      const offsetY = (cssHeight - gridHeight) / 2;
      const sampleRadius = Math.max(
        1,
        Math.round(pixelRatio * Math.min(safeDotSize * 0.28, 1.5)),
      );
      const nextDots: Dot[] = [];
      let pointKey = 0;

      const alphaAt = (x: number, y: number) => {
        const pixelX = clamp(Math.round(x), 0, mask.width - 1);
        const pixelY = clamp(Math.round(y), 0, mask.height - 1);
        return pixels[(pixelY * mask.width + pixelX) * 4 + 3];
      };

      for (let row = 0; row < rows; row += 1) {
        const y = offsetY + row * pitch;
        const sampleY = (y + safeDotSize / 2) * pixelRatio;

        for (let column = 0; column < columns; column += 1) {
          const x = offsetX + column * pitch;
          const sampleX = (x + safeDotSize / 2) * pixelRatio;
          const alpha = Math.max(
            alphaAt(sampleX, sampleY),
            alphaAt(sampleX - sampleRadius, sampleY),
            alphaAt(sampleX + sampleRadius, sampleY),
            alphaAt(sampleX, sampleY - sampleRadius),
            alphaAt(sampleX, sampleY + sampleRadius),
          );

          if (alpha < 48) continue;

          const key = pointKey;
          nextDots.push({
            x,
            y,
            key,
            phase: hashUnit(seed, key, 29),
            rate: 0.76 + hashUnit(seed, key, 43) * 0.48,
          });
          pointKey += 1;
        }
      }

      dots = nextDots;
      elapsed = 0;
      paint(0, true);
      syncAnimation();
    };

    const requestRebuild = () => {
      if (destroyed || !fontsReady || rebuildFrame) return;
      rebuildFrame = requestAnimationFrame(rebuild);
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(requestRebuild);
    resizeObserver?.observe(canvas);

    const onWindowResize = () => requestRebuild();
    if (!resizeObserver) window.addEventListener("resize", onWindowResize);

    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              isIntersecting = Boolean(entry?.isIntersecting);
              syncAnimation();
            },
            { threshold: 0.05 },
          );
    intersectionObserver?.observe(canvas);

    const onVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      syncAnimation();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      syncAnimation();
    };
    motionQuery.addEventListener("change", onMotionPreferenceChange);

    const prepareFonts = async () => {
      try {
        if ("fonts" in document && maskShape === "text") {
          await document.fonts.ready;
          await document.fonts.load(fontAt(64), text);
        }
      } catch {
        // A rejected custom-font load still leaves a usable system fallback.
      } finally {
        if (!destroyed) {
          fontsReady = true;
          requestRebuild();
        }
      }
    };

    void prepareFonts();

    return () => {
      destroyed = true;
      stopAnimation();
      if (rebuildFrame) cancelAnimationFrame(rebuildFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionPreferenceChange);
      if (!resizeObserver) window.removeEventListener("resize", onWindowResize);
    };
  }, [
    accentColor,
    accentDensity,
    animate,
    backgroundColor,
    baseColor,
    characterSpacing,
    dotSize,
    fontFamily,
    fontScale,
    fontWeight,
    gap,
    maskShape,
    orientation,
    seedKey,
    speed,
    text,
  ]);

  const accessibleLabel = ariaLabel ?? text;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-orientation={orientation}
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      style={{
        backgroundColor,
        display: "block",
        height: "100%",
        width: "100%",
      }}
    >
      {accessibleLabel}
    </canvas>
  );
}

export default DotMatrixText;

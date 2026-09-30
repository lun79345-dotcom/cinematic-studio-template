import type { CSSProperties } from "react";

export type FlowingDashedFrameSide = "top" | "right" | "bottom" | "left";

export type FlowingDashedFrameDirection =
  | "clockwise"
  | "counterclockwise"
  | "forward"
  | "reverse";

export type FlowingDashedFrameProps = {
  /** Sides to draw. Individual side props can override this list. */
  sides?: readonly FlowingDashedFrameSide[];
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  /** Length of each dash in CSS pixels. */
  dash?: number;
  /** Space between dashes in CSS pixels. */
  gap?: number;
  /** Seconds taken for the pattern to advance by one dash-and-gap interval. */
  duration?: number;
  direction?: FlowingDashedFrameDirection;
  color?: string;
  opacity?: number;
  className?: string;
};

type FrameStyle = CSSProperties & {
  "--flowing-frame-duration": string;
  "--flowing-frame-offset": string;
};

const ALL_SIDES: readonly FlowingDashedFrameSide[] = [
  "top",
  "right",
  "bottom",
  "left",
];

const SEGMENTS: Record<
  FlowingDashedFrameSide,
  { x1: string; y1: string; x2: string; y2: string }
> = {
  top: { x1: "0%", y1: "0%", x2: "100%", y2: "0%" },
  right: { x1: "100%", y1: "0%", x2: "100%", y2: "100%" },
  bottom: { x1: "100%", y1: "100%", x2: "0%", y2: "100%" },
  left: { x1: "0%", y1: "100%", x2: "0%", y2: "0%" },
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * A non-interactive SVG overlay for a subtle, continuously flowing frame.
 * Its parent should establish the desired positioning context.
 */
export function FlowingDashedFrame({
  sides = ALL_SIDES,
  top,
  right,
  bottom,
  left,
  dash = 6,
  gap = 8,
  duration = 1.6,
  direction = "clockwise",
  color = "rgb(var(--color-accent, 222 189 135))",
  opacity = 0.32,
  className,
}: FlowingDashedFrameProps) {
  const sideOverrides: Partial<Record<FlowingDashedFrameSide, boolean>> = {
    top,
    right,
    bottom,
    left,
  };
  const enabledSides = new Set(sides);
  const safeDash = Math.max(0.5, finiteOr(dash, 6));
  const safeGap = Math.max(0.5, finiteOr(gap, 8));
  const safeDuration = Math.max(0.1, finiteOr(duration, 1.6));
  const safeOpacity = Math.min(1, Math.max(0, finiteOr(opacity, 0.32)));
  const reverse = direction === "counterclockwise" || direction === "reverse";
  const segmentStyle: FrameStyle = {
    "--flowing-frame-duration": `${safeDuration}s`,
    "--flowing-frame-offset": `${-(safeDash + safeGap)}px`,
    animationDirection: reverse ? "reverse" : "normal",
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{
        color,
        display: "block",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
        position: "absolute",
      }}
    >
      <style>{`
        @keyframes studio-flowing-dashed-frame {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: var(--flowing-frame-offset); }
        }

        .studio-flowing-dashed-frame__segment {
          animation-duration: var(--flowing-frame-duration);
          animation-iteration-count: infinite;
          animation-name: studio-flowing-dashed-frame;
          animation-timing-function: linear;
          will-change: stroke-dashoffset;
        }

        @media (prefers-reduced-motion: reduce) {
          .studio-flowing-dashed-frame__segment {
            animation: none;
            stroke-dashoffset: 0;
            will-change: auto;
          }
        }
      `}</style>

      {ALL_SIDES.map((side) => {
        const isEnabled = sideOverrides[side] ?? enabledSides.has(side);
        if (!isEnabled) return null;

        return (
          <line
            key={side}
            {...SEGMENTS[side]}
            className="studio-flowing-dashed-frame__segment"
            stroke="currentColor"
            strokeDasharray={`${safeDash} ${safeGap}`}
            strokeLinecap="butt"
            strokeOpacity={safeOpacity}
            strokeWidth="1"
            style={segmentStyle}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

export default FlowingDashedFrame;

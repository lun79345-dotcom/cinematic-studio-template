"use client";

import { cn } from "@/lib/utils";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const finePointerQuery = "(hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

type InteractionMode = "idle" | "pointer" | "focus";

type CardInteractionContextValue = {
  isMouseEntered: boolean;
  setIsMouseEntered: React.Dispatch<React.SetStateAction<boolean>>;
  mode: InteractionMode;
};

const CardInteractionContext = createContext<CardInteractionContextValue | undefined>(undefined);

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

function isPrecisePointer(event: React.PointerEvent<HTMLDivElement>) {
  return event.pointerType === "mouse" || event.pointerType === "pen";
}

export type CardContainerProps = {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
};

export function CardContainer({
  children,
  className,
  containerClassName,
  intensity = 4,
}: CardContainerProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const hasFinePointer = useMediaQuery(finePointerQuery);
  const prefersReducedMotion = useMediaQuery(reducedMotionQuery);
  const canTilt = hasFinePointer && !prefersReducedMotion;
  const tiltIntensity = Number.isFinite(intensity) ? Math.max(0, Math.min(10, intensity)) : 4;

  const cancelPendingFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    pendingPointerRef.current = null;
  }, []);

  const resetTilt = useCallback(() => {
    cancelPendingFrame();
    setIsMouseEntered(false);

    if (cardRef.current) {
      cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    }
  }, [cancelPendingFrame]);

  useEffect(() => {
    if (!canTilt) resetTilt();
  }, [canTilt, resetTilt]);

  useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  const updateTilt = useCallback(() => {
    animationFrameRef.current = null;

    const card = cardRef.current;
    const pointer = pendingPointerRef.current;
    pendingPointerRef.current = null;

    if (!card || !pointer) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const normalizedX = Math.max(-0.5, Math.min(0.5, (pointer.x - left) / width - 0.5));
    const normalizedY = Math.max(-0.5, Math.min(0.5, (pointer.y - top) / height - 0.5));
    const rotateX = normalizedY * tiltIntensity * -1.5;
    const rotateY = normalizedX * tiltIntensity * 2;

    card.style.transform = `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;
  }, [tiltIntensity]);

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt || !isPrecisePointer(event)) return;
    setIsMouseEntered(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt || !isPrecisePointer(event)) return;

    pendingPointerRef.current = { x: event.clientX, y: event.clientY };
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(updateTilt);
    }
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;
    if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
      setIsFocusWithin(false);
    }
  };

  const pointerInteractionIsActive = canTilt && isMouseEntered;
  const mode: InteractionMode = prefersReducedMotion
    ? "idle"
    : pointerInteractionIsActive
      ? "pointer"
      : isFocusWithin
        ? "focus"
        : "idle";

  const contextValue = useMemo<CardInteractionContextValue>(
    () => ({
      isMouseEntered: pointerInteractionIsActive,
      setIsMouseEntered,
      mode,
    }),
    [mode, pointerInteractionIsActive],
  );

  return (
    <CardInteractionContext.Provider value={contextValue}>
      <div
        className={cn("relative h-full w-full [perspective:1200px]", containerClassName)}
      >
        <div
          ref={cardRef}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
          onPointerCancel={resetTilt}
          onFocusCapture={() => setIsFocusWithin(true)}
          onBlurCapture={handleBlurCapture}
          className={cn(
            "relative h-full w-full transition-transform duration-200 [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
            pointerInteractionIsActive && "will-change-transform",
            className,
          )}
          style={{ transform: "rotateX(0deg) rotateY(0deg)" }}
        >
          {children}
        </div>
      </div>
    </CardInteractionContext.Provider>
  );
}

export type CardBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div
      className={cn(
        "h-full w-full [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TransformValue = number | string;

type CardItemOwnProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  translateX?: TransformValue;
  translateY?: TransformValue;
  translateZ?: TransformValue;
  rotateX?: TransformValue;
  rotateY?: TransformValue;
  rotateZ?: TransformValue;
};

export type CardItemProps<T extends React.ElementType = "div"> = CardItemOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof CardItemOwnProps<T>>;

function withUnit(value: TransformValue, unit: "px" | "deg") {
  if (typeof value === "number") return `${value}${unit}`;

  const normalized = value.trim();
  return /^-?(?:\d+|\d*\.\d+)$/.test(normalized) ? `${normalized}${unit}` : normalized;
}

function focusDepth(value: TransformValue) {
  const normalized = withUnit(value, "px");
  return normalized === "0px" ? normalized : `clamp(-1rem, ${normalized}, 1rem)`;
}

export function CardItem<T extends React.ElementType = "div">({
  as,
  children,
  className,
  style,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: CardItemProps<T>) {
  const { mode } = useCardInteraction();
  const Component = (as ?? "div") as React.ElementType;

  const transform =
    mode === "pointer"
      ? [
          `translate3d(${withUnit(translateX, "px")}, ${withUnit(translateY, "px")}, ${withUnit(translateZ, "px")})`,
          `rotateX(${withUnit(rotateX, "deg")})`,
          `rotateY(${withUnit(rotateY, "deg")})`,
          `rotateZ(${withUnit(rotateZ, "deg")})`,
        ].join(" ")
      : mode === "focus"
        ? `translate3d(0px, 0px, ${focusDepth(translateZ)})`
        : "translate3d(0px, 0px, 0px)";

  return (
    <Component
      className={cn(
        "w-fit transition-transform duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        className,
      )}
      style={{
        ...style,
        transform,
        transformStyle: "preserve-3d",
        willChange: mode === "idle" ? "auto" : "transform",
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

function useCardInteraction() {
  const context = useContext(CardInteractionContext);
  if (!context) {
    throw new Error("Card components must be used within CardContainer");
  }
  return context;
}

export function useMouseEnter(): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
] {
  const { isMouseEntered, setIsMouseEntered } = useCardInteraction();
  return [isMouseEntered, setIsMouseEntered];
}

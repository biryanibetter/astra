"use client";

import Image from "next/image";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getReducedMotion } from "@/lib/motion-preference";

export interface DisciplinePreview {
  readonly id: string;
  readonly name: string;
  readonly copy: string;
  readonly color: string;
  readonly image: string;
}

export interface HoverPreviewProps {
  readonly disciplines: readonly DisciplinePreview[];
  readonly className?: string;
}

interface HoverLinkProps {
  readonly children: React.ReactNode;
  readonly disciplineId: string;
  readonly onActivate: (
    id: string,
    event:
      | React.PointerEvent
      | React.FocusEvent
      | React.MouseEvent
      | React.KeyboardEvent,
  ) => void;
  readonly onDeactivate: () => void;
  readonly onPositionUpdate: (
    event: React.PointerEvent | React.MouseEvent,
  ) => void;
}

interface PreviewCardProps {
  readonly surfaceRef?: React.Ref<HTMLDivElement>;
  readonly discipline: DisciplinePreview | null;
  readonly position: { readonly x: number; readonly y: number };
  readonly isVisible: boolean;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 280;
const CURSOR_OFFSET_Y = 16;
const VIEWPORT_MARGIN = 20;

function calculatePosition(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  // Default: position card above and centered on cursor
  let x = clientX - CARD_WIDTH / 2;
  let y = clientY - CARD_HEIGHT - CURSOR_OFFSET_Y;

  // Horizontal bounds
  if (x + CARD_WIDTH > viewportWidth - VIEWPORT_MARGIN) {
    x = viewportWidth - CARD_WIDTH - VIEWPORT_MARGIN;
  }
  if (x < VIEWPORT_MARGIN) {
    x = VIEWPORT_MARGIN;
  }

  // Vertical bounds - if card would go above viewport, position below cursor instead
  if (y < VIEWPORT_MARGIN) {
    y = clientY + CURSOR_OFFSET_Y;
    // Check if below-cursor position also overflows
    if (y + CARD_HEIGHT > viewportHeight - VIEWPORT_MARGIN) {
      y = viewportHeight - CARD_HEIGHT - VIEWPORT_MARGIN;
    }
  }

  return { x, y };
}

export function HoverLink({
  children,
  disciplineId,
  onActivate,
  onDeactivate,
  onPositionUpdate,
}: HoverLinkProps) {
  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && "ontouchstart" in window,
    [],
  );

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") {
        onActivate(disciplineId, event);
      }
    },
    [disciplineId, onActivate],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") {
        onPositionUpdate(event);
      }
    },
    [onPositionUpdate],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onActivate(disciplineId, event);
    },
    [disciplineId, onActivate],
  );

  const handleBlur = useCallback(() => {
    onDeactivate();
  }, [onDeactivate]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isTouchDevice) {
        event.preventDefault();
        onActivate(disciplineId, event);
      }
    },
    [disciplineId, onActivate, isTouchDevice],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate(disciplineId, event);
      } else if (event.key === "Escape") {
        onDeactivate();
      }
    },
    [disciplineId, onActivate, onDeactivate],
  );

  return (
    <button
      type="button"
      aria-expanded="false"
      aria-controls="hover-preview-card"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={onDeactivate}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        font: "inherit",
        letterSpacing: "inherit",
        lineHeight: "inherit",
        padding: 0,
        border: 0,
        borderBottom: "2px solid rgba(255, 255, 255, 0.25)",
        background: "none",
        color: "white",
        transition:
          "border-color 0.3s var(--ease), text-shadow 0.3s var(--ease)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--silver)";
        e.currentTarget.style.textShadow = "0 0 28px rgba(198, 204, 213, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
        e.currentTarget.style.textShadow = "none";
      }}
    >
      {children}
    </button>
  );
}

export function PreviewCard({
  surfaceRef,
  discipline,
  position,
  isVisible,
}: PreviewCardProps) {
  if (!discipline || !isVisible) return null;

  const cardStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    pointerEvents: "none",
    opacity: isVisible ? 1 : 0,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  };

  return (
    <div
      id="hover-preview-card"
      ref={surfaceRef}
      role="tooltip"
      style={cardStyle}
      aria-hidden={!isVisible}
    >
      <div
        className="glass"
        style={{
          borderRadius: "8px",
          padding: "8px",
          width: `${CARD_WIDTH}px`,
          background: `radial-gradient(ellipse at 70% 0%, ${discipline.color}80, transparent 75%), var(--bg-secondary)`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "180px",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <Image
            src={discipline.image}
            alt={`${discipline.name} preview`}
            fill
            sizes="304px"
            style={{
              objectFit: "cover",
              borderRadius: "4px",
              display: "block",
            }}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <p
          style={{
            fontSize: "16px",
            fontWeight: 600,
            textTransform: "capitalize",
            padding: "12px 8px 5px",
            margin: "0 0 8px",
            color: "white",
          }}
        >
          {discipline.name}
        </p>
        <span
          style={{
            fontSize: "13px",
            color: "var(--muted)",
            display: "block",
            padding: "0 8px 8px",
          }}
        >
          {discipline.copy}
        </span>
      </div>
    </div>
  );
}

export function HoverPreview({
  disciplines,
  className = "",
}: HoverPreviewProps) {
  const [activeDiscipline, setActiveDiscipline] =
    useState<DisciplinePreview | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleActivate = useCallback(
    (
      id: string,
      event:
        | React.PointerEvent
        | React.FocusEvent
        | React.MouseEvent
        | React.KeyboardEvent,
    ) => {
      const discipline = disciplines.find((d) => d.id === id);
      if (!discipline) return;

      setActiveDiscipline(discipline);
      setIsVisible(true);

      const clientX =
        "clientX" in event
          ? event.clientX
          : event.currentTarget.getBoundingClientRect().left;
      const clientY =
        "clientY" in event
          ? event.clientY
          : event.currentTarget.getBoundingClientRect().top;

      const newPos = calculatePosition(
        clientX,
        clientY,
        window.innerWidth,
        window.innerHeight,
      );
      setPosition(newPos);
      pendingPositionRef.current = newPos;
    },
    [disciplines],
  );

  const handleDeactivate = useCallback(() => {
    setIsVisible(false);
    setActiveDiscipline(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handlePositionUpdate = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      if (!isVisible || getReducedMotion()) return;

      const newPos = calculatePosition(
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight,
      );
      pendingPositionRef.current = newPos;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingPositionRef.current && !getReducedMotion()) {
            const { x, y } = pendingPositionRef.current;
            if (surfaceRef.current)
              surfaceRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          }
          rafRef.current = null;
        });
      }
    },
    [isVisible],
  );

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible && activeDiscipline) {
        const newPos = calculatePosition(
          (pendingPositionRef.current?.x ?? 0) + CARD_WIDTH / 2,
          (pendingPositionRef.current?.y ?? 0) + CARD_HEIGHT + CURSOR_OFFSET_Y,
          window.innerWidth,
          window.innerHeight,
        );
        setPosition(newPos);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible, activeDiscipline]);

  // Global Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        handleDeactivate();
      }
    };

    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, handleDeactivate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      <style jsx>{`
        .hover-link {
          font: inherit;
          letter-spacing: inherit;
          line-height: inherit;
          padding: 0;
          border: 0;
          border-bottom: 2px solid rgba(255, 255, 255, 0.25);
          background: none;
          color: white;
          transition: border-color 0.3s var(--ease), text-shadow 0.3s var(--ease);
          cursor: pointer;
        }
        .hover-link:hover,
        .hover-link:focus-visible,
        .hover-link[aria-expanded="true"] {
          border-color: var(--silver);
          text-shadow: 0 0 28px rgba(198, 204, 213, 0.4);
        }
        .hover-link:focus-visible {
          outline: none;
        }
      `}</style>
      <div className={className}>
        {disciplines.map((discipline, index) => (
          <span key={discipline.id} style={{ display: "inline" }}>
            {index === disciplines.length - 1 ? "and " : ""}
            <HoverLink
              disciplineId={discipline.id}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onPositionUpdate={handlePositionUpdate}
            >
              {discipline.name}
            </HoverLink>
            {index < disciplines.length - 2
              ? ", "
              : index === disciplines.length - 2
                ? " "
                : "."}
          </span>
        ))}
        <PreviewCard
          surfaceRef={surfaceRef}
          discipline={activeDiscipline}
          position={position}
          isVisible={isVisible}
        />
      </div>
    </>
  );
}

"use client";

import {
  defaultObjectSizing,
  liquidMetalFragmentShader,
  ShaderFitOptions,
  ShaderMount,
} from "@paper-design/shaders";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ComponentProps,
  MouseEventHandler,
  MutableRefObject,
  PointerEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useRef } from "react";
import "./liquid-metal-button.css";

type Props = Omit<
  ComponentProps<typeof Link>,
  "children" | "onNavigate" | "onClick" | "href"
> & {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const clearTimer = (timer: MutableRefObject<number | null>) => {
  if (timer.current !== null) window.clearTimeout(timer.current);
  timer.current = null;
};

export function LiquidMetalButton({
  href,
  children,
  className = "",
  onClick: onClickProp,
  target,
  download,
  ...props
}: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLAnchorElement>(null);
  const shaderRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<ShaderMount | null>(null);
  const navigationTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const pendingNavigationRef = useRef(false);
  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);

  const setActive = useCallback((active: boolean) => {
    rootRef.current?.setAttribute("data-liquid-active", String(active));
  }, []);
  const animate = useCallback((speed: number) => {
    mountRef.current?.setSpeed(speed);
  }, []);
  const finishActivation = useCallback(() => {
    pressedRef.current = false;
    pendingNavigationRef.current = false;
    setActive(false);
    rootRef.current?.setAttribute("data-pressed", "false");
    rootRef.current?.setAttribute("data-ripple-active", "false");
    animate(hoveredRef.current ? 0.12 : 0);
  }, [animate, setActive]);

  useEffect(() => {
    const host = shaderRef.current;
    const root = rootRef.current;
    let mount: ShaderMount | null = null;

    if (!host || !root) {
      if (root) root.dataset.shaderState = "fallback";
    } else {
      try {
        mount = new ShaderMount(
          host,
          liquidMetalFragmentShader,
          {
            u_fit: ShaderFitOptions[defaultObjectSizing.fit],
            u_scale: defaultObjectSizing.scale,
            u_rotation: defaultObjectSizing.rotation,
            u_originX: defaultObjectSizing.originX,
            u_originY: defaultObjectSizing.originY,
            u_offsetX: defaultObjectSizing.offsetX,
            u_offsetY: defaultObjectSizing.offsetY,
            u_worldWidth: defaultObjectSizing.worldWidth,
            u_worldHeight: defaultObjectSizing.worldHeight,
            u_colorBack: [0.025, 0.028, 0.032, 1],
            u_colorTint: [0.72, 0.75, 0.79, 1],
            u_repetition: 4,
            u_shiftRed: 0,
            u_shiftBlue: 0,
            u_contour: 0.35,
            u_softness: 0.72,
            u_distortion: 0.12,
            u_angle: 35,
            u_shape: 0,
            u_isImage: false,
          },
          undefined,
          0,
          0,
          1.25,
          280_000,
        );
        mountRef.current = mount;
        root.dataset.shaderState = "ready";
      } catch {
        host.replaceChildren();
        root.dataset.shaderState = "fallback";
      }
    }

    return () => {
      clearTimer(navigationTimerRef);
      clearTimer(resetTimerRef);
      clearTimer(pressTimerRef);
      mount?.dispose();
      mountRef.current = null;
      host?.replaceChildren();
    };
  }, []);

  const setRippleOrigin = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--press-x",
      `${event.clientX ? event.clientX - rect.left : rect.width / 2}px`,
    );
    event.currentTarget.style.setProperty(
      "--press-y",
      `${event.clientY ? event.clientY - rect.top : rect.height / 2}px`,
    );
  };

  const beginActivation = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    clearTimer(resetTimerRef);
    rootRef.current?.setAttribute("data-ripple-active", "true");
    setActive(true);
    if (event.detail === 0) {
      pressedRef.current = true;
      rootRef.current?.setAttribute("data-pressed", "true");
      setRippleOrigin(event);
      pressTimerRef.current = window.setTimeout(() => {
        pressedRef.current = false;
        rootRef.current?.setAttribute("data-pressed", "false");
      }, 130);
    }
    animate(0.62);
    resetTimerRef.current = window.setTimeout(finishActivation, 640);
  };

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onClickProp?.(event);
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
    beginActivation(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    clearTimer(resetTimerRef);
    pressedRef.current = true;
    event.currentTarget.dataset.pressed = "true";
    setActive(true);
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--press-x",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--press-y",
      `${event.clientY - rect.top}px`,
    );
    animate(0.62);
  };

  return (
    <Link
      {...props}
      ref={rootRef}
      href={href}
      target={target}
      download={download}
      className={`liquid-metal-button ${className}`}
      data-liquid-active="false"
      data-pressed="false"
      data-ripple-active="false"
      data-shader-state="loading"
      onClick={handleClick}
      onPointerEnter={() => {
        hoveredRef.current = true;
        animate(0.12);
      }}
      onPointerLeave={(event) => {
        hoveredRef.current = false;
        if (!pendingNavigationRef.current) {
          if (!pressedRef.current) setActive(false);
          event.currentTarget.dataset.pressed = "false";
        }
        animate(pendingNavigationRef.current ? 0.62 : 0);
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={() => {
        if (!pressedRef.current) return;
        clearTimer(pressTimerRef);
        pressTimerRef.current = window.setTimeout(() => {
          pressedRef.current = false;
          rootRef.current?.setAttribute("data-pressed", "false");
        }, 110);
      }}
      onPointerCancel={(event) => {
        pressedRef.current = false;
        event.currentTarget.dataset.pressed = "false";
        if (!pendingNavigationRef.current) setActive(false);
        animate(hoveredRef.current ? 0.12 : 0);
      }}
      onFocus={() => animate(0.12)}
      onBlur={() => {
        if (!pendingNavigationRef.current && !pressedRef.current)
          setActive(false);
        animate(hoveredRef.current ? 0.12 : 0);
      }}
      onNavigate={(event) => {
        if ((target && target !== "_self") || download !== undefined) return;
        event.preventDefault();
        pendingNavigationRef.current = true;
        setActive(true);
        rootRef.current?.setAttribute("data-ripple-active", "true");
        animate(0.62);
        clearTimer(navigationTimerRef);
        clearTimer(resetTimerRef);
        navigationTimerRef.current = window.setTimeout(() => {
          pendingNavigationRef.current = false;
          router.push(href);
          resetTimerRef.current = window.setTimeout(finishActivation, 900);
        }, 520);
      }}
    >
      <span className="liquid-metal-content">{children}</span>
      <span className="liquid-metal-border" aria-hidden="true">
        <span ref={shaderRef} className="liquid-metal-shader" />
      </span>
      <span className="liquid-metal-ripple" aria-hidden="true" />
    </Link>
  );
}

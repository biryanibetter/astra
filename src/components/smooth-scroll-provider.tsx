"use client";

import type Lenis from "lenis";
import type { LenisOptions, VirtualScrollData } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import "lenis/dist/lenis.css";

const options: LenisOptions = {
  autoRaf: true,
  allowNestedScroll: true,
  anchors: false,
  stopInertiaOnNavigate: true,
  // Preserve Astra's established motion policy without changing the OS signal.
  respectReducedMotion: false,
  // Local galleries/chapter interactions may already own a bubbling event.
  // Lenis 1.3.27 does not check defaultPrevented itself. Never rewrite deltas.
  virtualScroll: ({ event }) => !event.defaultPrevented,
};

function cancelInertia(lenis: Lenis) {
  if (lenis.isStopped) return;
  // Public lifecycle methods cancel without writing/clamping the browser's
  // restored position against a previous route's cached dimensions.
  lenis.stop();
  lenis.start();
}

function ScrollLifecycle() {
  const lenis = useLenis();
  const pathname = usePathname();
  const searchParams = useSearchParams().toString();
  const pendingAnchor = useRef<HTMLElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Route identity cancels old momentum; Next owns the destination and history restoration.
  useEffect(() => {
    if (!lenis) return;
    pendingAnchor.current = null;
    lenis.resize();
    cancelInertia(lenis);
  }, [lenis, pathname, searchParams]);

  useEffect(() => {
    if (!lenis) return;
    const synchronize = () => {
      pendingAnchor.current = null;
      cancelInertia(lenis);
    };
    const reverse = ({ deltaY, event }: VirtualScrollData) => {
      if (
        event.type !== "wheel" ||
        event.ctrlKey ||
        !deltaY ||
        lenis.isStopped ||
        lenis.isLocked
      )
        return;
      const pending = lenis.targetScroll - lenis.actualScroll;
      if (pending * deltaY < 0) {
        // This event is emitted before Lenis adds the normalized input. Discard
        // only opposing unfinished travel; Lenis then consumes this delta once.
        // No multiplier, viewport cap, target mutation or second wheel listener.
        synchronize();
      }
    };
    const unsubscribe = lenis.on("virtual-scroll", reverse);
    window.addEventListener("popstate", synchronize);
    const host = window as Window & { __LENIS__?: typeof lenis };
    host.__LENIS__ = lenis;
    return () => {
      unsubscribe();
      window.removeEventListener("popstate", synchronize);
      if (host.__LENIS__ === lenis) delete host.__LENIS__;
    };
  }, [lenis]);

  useEffect(() => {
    if (!lenis) return;
    const scrollToAnchor = (target: HTMLElement) => {
      if (!target.isConnected) return;
      if (lenis.isStopped) {
        pendingAnchor.current = target;
        return;
      }
      lenis.resize();
      lenis.scrollTo(target, {
        onComplete: () => {
          const tabIndex = target.getAttribute("tabindex");
          if (tabIndex === null) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          if (tabIndex === null) target.removeAttribute("tabindex");
        },
      });
    };
    const unsubscribe = lenis.on("scroll", () => {
      if (!pendingAnchor.current || lenis.isStopped) return;
      const target = pendingAnchor.current;
      pendingAnchor.current = null;
      scrollToAnchor(target);
    });
    const anchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const url = new URL(anchor.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        return;
      let target: HTMLElement | null;
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      if (!target) return;
      event.preventDefault();
      if (url.href !== location.href)
        history.pushState(history.state, "", url.href);
      // A same-page menu link must wait for the modal's closing animation to
      // release its lock. Never force an animation through a stopped instance.
      scrollToAnchor(target);
    };
    // Own same-document fragments before Next's Link handler or the browser can
    // also jump. Lenis 1.3.27's anchors option does not prevent that default.
    document.addEventListener("click", anchorClick, true);
    return () => {
      unsubscribe();
      pendingAnchor.current = null;
      document.removeEventListener("click", anchorClick, true);
    };
  }, [lenis]);
  return null;
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The official adapter creates/destroys the instance in its effect, including
  // Strict Mode replay. autoRaf is the sole Lenis driver; no app RAF calls raf().
  return (
    <ReactLenis root options={options}>
      <Suspense fallback={null}>
        <ScrollLifecycle />
      </Suspense>
      {children}
    </ReactLenis>
  );
}

export function useSmoothScroll() {
  return useLenis();
}

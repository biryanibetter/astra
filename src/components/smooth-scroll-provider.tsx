"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import "lenis/dist/lenis.css";

const options: LenisOptions = {
  lerp: 0.065,
  smoothWheel: true,
  wheelMultiplier: 1,
  syncTouch: false,
  autoRaf: false,
  allowNestedScroll: true,
  anchors: false,
  stopInertiaOnNavigate: true,
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

function resetScrollToTop(lenis: Lenis) {
  // Immediately reset both the animated scroll position and the browser scroll position
  // to the top. This prevents the footer from flashing on route transitions.
  lenis.scrollTo(0, { immediate: true, force: true });
  // Also synchronize the browser's native scroll position
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}

function ScrollLifecycle() {
  const lenis = useLenis();
  const pathname = usePathname();
  const searchParams = useSearchParams().toString();
  const pendingAnchor = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!lenis) return;
    gsap.registerPlugin(ScrollTrigger);
    const unsubscribe = lenis.on("scroll", ScrollTrigger.update);
    const advance = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(advance);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(advance);
      unsubscribe();
    };
  }, [lenis]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Route identity cancels old momentum; Next owns the destination and history restoration.
  useEffect(() => {
    if (!lenis) return;
    pendingAnchor.current = null;
    lenis.resize();
    cancelInertia(lenis);
    // Reset scroll position to top on route change before destination content renders.
    // Preserve legitimate anchor navigation: if the URL has a hash, let the browser
    // handle it (or the anchor handler below) instead of forcing scroll to top.
    if (typeof window !== "undefined" && !window.location.hash) {
      resetScrollToTop(lenis);
    }
  }, [lenis, pathname, searchParams]);

  useEffect(() => {
    if (!lenis) return;
    const synchronize = () => {
      pendingAnchor.current = null;
      cancelInertia(lenis);
    };
    window.addEventListener("popstate", synchronize);
    const host = window as Window & { __LENIS__?: typeof lenis };
    host.__LENIS__ = lenis;
    return () => {
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
        !url.hash
      )
        return;
      // Experiences is a section of the current homepage. Keep its query
      // string so a tagged homepage visit doesn't trigger route navigation.
      if (url.pathname === "/" && url.hash === "#events" && !url.search)
        url.search = location.search;
      if (url.search !== location.search) return;
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
  // The adapter owns the instance; ScrollLifecycle owns its only frame driver.
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

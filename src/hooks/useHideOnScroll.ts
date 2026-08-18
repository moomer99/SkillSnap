"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Hide-on-scroll-down / reveal-on-scroll-up for a sticky header, matching
 * the mobile app's FeedScreen (headerTranslateY + setHeaderHidden(delta > 0)).
 *
 * The element stays `position: sticky`; the caller applies
 * `translateY(-height)` while `hidden` is true. Rules, in order:
 *   - at or above its own height from the top it is always visible, so the
 *     header never disappears while any of its own slot is still on screen
 *   - scroll deltas under DELTA_THRESHOLD px are ignored, so trackpad jitter
 *     and rubber-banding do not flap it
 *   - otherwise hidden = scrolling down
 *
 * The height is measured with a ResizeObserver, never hard-coded: the first
 * row is a logo below md and an <h1> from md up, and the radius pills only
 * render once a location is set. The scroll handler is passive and coalesced
 * to one read per animation frame.
 *
 * `disabled` (e.g. while a modal has locked body scroll) forces the header
 * visible and stops listening.
 */
const DELTA_THRESHOLD = 6;

export function useHideOnScroll<T extends HTMLElement>(disabled = false) {
  const ref = useRef<T>(null);
  const [hidden, setHidden] = useState(false);
  const [height, setHeight] = useState(0);
  const heightRef = useRef(0);
  const lastY = useRef(0);
  const frame = useRef<number | null>(null);
  // Diagnostics only: how many scroll events the listener has actually received.
  const scrollEvents = useRef(0);

  // Measure — offsetHeight ignores the translate transform.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      heightRef.current = h;
      setHeight((prev) => (prev === h ? prev : h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }
    lastY.current = window.scrollY;

    const onScroll = () => {
      scrollEvents.current += 1;
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;
        if (y <= heightRef.current) {
          setHidden(false);
          return;
        }
        if (Math.abs(delta) < DELTA_THRESHOLD) return;
        setHidden(delta > 0);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [disabled]);

  // For focus: a tab stop inside a hidden header must bring it back.
  const reveal = useCallback(() => setHidden(false), []);

  return { ref, hidden, height, reveal, scrollEvents };
}

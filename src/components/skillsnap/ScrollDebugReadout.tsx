"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * TEMPORARY diagnostic for the feed header hide-on-scroll (2026-08-19).
 * Renders only when the URL carries ?debug=scroll, so no real visitor sees it.
 * Polls four times a second and prints what the phone actually sees, so a
 * screenshot from a device with no remote inspector answers: is the window
 * the scroll container, and is the scroll listener firing at all?
 * Remove once the mobile header behaviour is understood.
 */
export default function ScrollDebugReadout({
  headerRef,
  height,
  hidden,
  scrollEvents,
}: {
  headerRef: RefObject<HTMLElement | null>;
  height: number;
  hidden: boolean;
  scrollEvents: RefObject<number>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    // Read the query on the client only; the feed is client-rendered.
    setEnabled(new URLSearchParams(window.location.search).get("debug") === "scroll");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const el = headerRef.current;
      const cs = el ? getComputedStyle(el) : null;
      const se = document.scrollingElement;
      setLines([
        `window.scrollY        ${Math.round(window.scrollY)}`,
        `html.scrollTop        ${Math.round(document.documentElement.scrollTop)}`,
        `body.scrollTop        ${Math.round(document.body.scrollTop)}`,
        `scrollingElement      ${se ? se.tagName : "null"}`,
        `header height (hook)  ${height}`,
        `hidden flag           ${hidden}`,
        `header transform      ${cs ? cs.transform : "-"}`,
        `header position       ${cs ? cs.position : "-"}`,
        `header rect.top       ${el ? Math.round(el.getBoundingClientRect().top) : "-"}`,
        `scroll events seen    ${scrollEvents.current}`,
        `visualViewport.h      ${window.visualViewport ? Math.round(window.visualViewport.height) : "-"}`,
        `innerW x innerH       ${window.innerWidth} x ${window.innerHeight}`,
        `UA                    ${navigator.userAgent.slice(0, 70)}`,
      ]);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [enabled, headerRef, height, hidden, scrollEvents]);

  if (!enabled) return null;

  return (
    <pre
      aria-hidden
      className="fixed left-2 right-2 bottom-24 z-[9999] rounded-lg p-2 text-[11px] leading-[1.35] whitespace-pre-wrap break-all pointer-events-none"
      style={{ background: "rgba(0,0,0,0.85)", color: "#ffffff", fontFamily: "ui-monospace, Menlo, monospace" }}
    >
      {lines.join("\n")}
    </pre>
  );
}

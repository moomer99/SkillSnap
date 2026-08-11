"use client";
import { useId } from "react";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** true on dark surfaces (white letters + gradient K), false on light (solid #0d0a1a). */
  dark?: boolean;
  /**
   * Render the brand-purple "any-surface" artwork instead of the dark/light
   * pair. #6c47ff passes WCAG on both #0d0a1a (3.70) and #f8f7f5 (4.92), so it
   * stays legible without knowing the surface — use it on theme-aware surfaces
   * (e.g. the legal pages) where `dark` can't be pinned. Takes precedence over `dark`.
   */
  anySurface?: boolean;
}

type Tone = "onDark" | "onLight" | "brand";

// Artwork inlined from public/{wordmark,mark}-{dark,light}-surface.svg.
// Kept inline (not <img>) so the SVGs paint with the first render — no flash —
// and so fills follow the `dark` prop. Gradient/mask ids are suffixed with a
// per-instance useId() because several logos render on one page and SVG ids
// are document-global; without this, later instances inherit the first one's
// gradient (and mask).

// Full wordmark viewBox 2416.07 × 468.13 → aspect 5.1611. Size by HEIGHT and
// let width follow, or the wider new mark renders shorter than the old one.
const FULL_HEIGHTS = { xs: 16, sm: 20, md: 26, lg: 36, xl: 50 } as const;
const WORDMARK_RATIO = 2416.07 / 468.13; // 5.1611

// Icon mark viewBox 863 × 907 → aspect 0.9515 (slightly taller than wide).
const ICON_HEIGHTS = { xs: 28, sm: 36, md: 44, lg: 64, xl: 88 } as const;
const ICON_RATIO = 863 / 907; // 0.9515

const INK = "#0d0a1a"; // solid ink: whole wordmark on light, the S on light marks
const WHITE = "#ffffff";
const BRAND = "#6c47ff"; // any-surface: theme-proof, passes on both backgrounds

/** Solid fill for the letters (wordmark) / the S (mark) per tone. */
function inkFor(tone: Tone) {
  return tone === "onDark" ? WHITE : tone === "brand" ? BRAND : INK;
}

function Wordmark({ uid, height, tone }: { uid: string; height: number; tone: Tone }) {
  const letter = inkFor(tone);
  // K is the gradient only on dark surfaces; solid (ink or brand) otherwise.
  const kFill = tone === "onDark" ? `url(#${uid}-k)` : letter;
  return (
    <svg
      height={height}
      width={Math.round(height * WORDMARK_RATIO)}
      viewBox="169.86 406.3 2416.07 468.13"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      {tone === "onDark" && (
        <defs>
          <linearGradient id={`${uid}-k`} x1="637.5" y1="781.61" x2="637.5" y2="401.57" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#511dec" />
            <stop offset=".17" stopColor="#5520ec" />
            <stop offset=".35" stopColor="#612cee" />
            <stop offset=".54" stopColor="#763ff0" />
            <stop offset=".72" stopColor="#935af3" />
            <stop offset=".91" stopColor="#b87cf8" />
            <stop offset="1" stopColor="#ce90fb" />
          </linearGradient>
        </defs>
      )}
      <path fill={letter} d="M474.56,406.32v79.2h-181.84c-8.92,0-21.14,14.6-22.63,23.47-4.13,24.5,3.31,43.83,30.04,46.51,44.09,4.42,87.08-7.53,130.61,9.67,94.04,37.15,76.27,218.75-38.33,218.75h-211.38v-79.2h187.38c9.75,0,21.6-15.49,22.91-25.03,2.88-20.85-2.85-42.31-26.6-44.97-64.93-7.27-157.8,20.99-186.38-62.69-23.66-69.25,1.09-165.7,88.54-165.7h207.68Z" />
      <path fill={letter} d="M1552.69,406.32v79.2h-181.84c-8.92,0-21.14,14.6-22.63,23.47-4.13,24.5,3.31,43.83,30.04,46.51,44.09,4.42,87.08-7.53,130.61,9.67,94.04,37.15,76.27,218.75-38.33,218.75h-211.38v-79.2h187.38c9.75,0,21.6-15.49,22.91-25.03,2.88-20.85-2.85-42.31-26.6-44.97-64.93-7.27-157.8,20.99-186.38-62.69-23.66-69.25,1.09-165.7,88.54-165.7h207.68Z" />
      <path fill={letter} d="M2377.61,783.91v90.25h-92.3v-368.39c56.56,2.74,116.51-3.64,172.69-.08,107.32,6.8,148.43,101.26,117.67,196.77-28.51,88.51-121.13,83.49-198.05,81.44ZM2377.61,715.76h54.46c69.72,0,76.55-118.58,19.33-137.17-4.09-1.33-17.75-4.66-21.18-4.66h-52.61v141.83Z" />
      <path fill={letter} d="M1947.67,702.47c-30.76-95.5,10.35-189.96,117.67-196.77,56.17-3.56,116.13,2.82,172.69.08v278.13h-92.3s0,0,0,0c-76.93,2.05-169.55,7.07-198.05-81.44ZM2145.72,573.93h-52.61c-3.43,0-17.09,3.33-21.18,4.66-57.21,18.59-50.39,137.17,19.33,137.17h54.46s0-141.83,0-141.83Z" />
      <path fill={letter} d="M1902.12,783.91h-92.3v-174.06c0-1.29-4.68-14.34-5.81-16.31-3.87-6.7-13.01-12.52-20.36-14.68-2.2-.65-13.99-3.09-15.36-3.09h-61.84v208.14h-92.3v-278.13h191.07c50.56,0,96.92,41.24,96.92,93.02v185.11Z" />
      <rect fill={letter} x="971.1" y="406.32" width="92.3" height="377.6" />
      <rect fill={letter} x="1111.07" y="406.32" width="92.3" height="377.6" />
      <rect fill={letter} x="831.14" y="505.78" width="92.3" height="278.13" />
      <rect fill={letter} x="831.14" y="406.32" width="92.3" height="71.84" />
      <polygon fill={kFill} points="654.69 783.89 783.78 783.89 616.44 595.63 783.19 406.34 655.71 406.34 491.22 595.63 654.69 783.89" />
    </svg>
  );
}

function Mark({ uid, height, tone }: { uid: string; height: number; tone: Tone }) {
  const sFill = inkFor(tone); // arcs + K stay gradients in every tone; only the S changes
  return (
    <svg
      height={height}
      width={Math.round(height * ICON_RATIO)}
      viewBox="190 187 863 907"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        {/* grayscale gradient that fades the upper arc through the mask */}
        <linearGradient id={`${uid}-mg`} x1="210.72" y1="350.99" x2="1053.94" y2="350.99" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" />
          <stop offset=".06" stopColor="#151515" />
          <stop offset=".26" stopColor="#5b5b5b" />
          <stop offset=".45" stopColor="#959595" />
          <stop offset=".63" stopColor="#c3c3c3" />
          <stop offset=".78" stopColor="#e3e3e3" />
          <stop offset=".91" stopColor="#f7f7f7" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={`${uid}-mask`} x="210.72" y="186.38" width="843.22" height="329.22" maskUnits="userSpaceOnUse">
          <path fill={`url(#${uid}-mg)`} d="M1029.1,515.6c-9.99,0-19.4-6.06-23.2-15.94-60.55-157.66-214.73-263.59-383.66-263.59-153.81,0-293.53,84.82-364.64,221.37-6.34,12.17-21.34,16.9-33.51,10.56-12.17-6.34-16.9-21.34-10.56-33.51,38.31-73.57,95.87-135.58,166.47-179.32,72.63-45,156.39-68.79,242.24-68.79,94.98,0,186.17,28.68,263.72,82.94,37.34,26.13,70.56,57.57,98.71,93.44,28.42,36.21,51.17,76.27,67.61,119.08,4.92,12.81-1.48,27.18-14.29,32.1-2.93,1.13-5.94,1.66-8.9,1.66Z" />
        </mask>
        <linearGradient id={`${uid}-a2`} x1="632.33" y1="509.65" x2="632.33" y2="192.33" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ce90fb" />
          <stop offset=".14" stopColor="#c789fa" />
          <stop offset=".35" stopColor="#b478f7" />
          <stop offset=".59" stopColor="#965cf4" />
          <stop offset=".85" stopColor="#6c36ef" />
          <stop offset="1" stopColor="#511dec" />
        </linearGradient>
        <linearGradient id={`${uid}-a3`} x1="465.61" y1="1088.48" x2="465.61" y2="709.78" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#511dec" />
          <stop offset=".33" stopColor="#7740f0" />
          <stop offset="1" stopColor="#ce90fb" />
        </linearGradient>
        <linearGradient id={`${uid}-k`} x1="776.82" y1="806.97" x2="776.82" y2="457.06" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#511dec" />
          <stop offset=".17" stopColor="#5520ec" />
          <stop offset=".35" stopColor="#612cee" />
          <stop offset=".54" stopColor="#763ff0" />
          <stop offset=".72" stopColor="#935af3" />
          <stop offset=".91" stopColor="#b87cf8" />
          <stop offset="1" stopColor="#ce90fb" />
        </linearGradient>
      </defs>
      <g mask={`url(#${uid}-mask)`}>
        <path
          fill="none"
          stroke={`url(#${uid}-a2)`}
          strokeWidth={37.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M235.57,445.97c72.63-139.49,218.53-234.74,386.67-234.74,185.59,0,344.07,116.04,406.85,279.53"
        />
      </g>
      <path
        fill="none"
        stroke={`url(#${uid}-a3)`}
        strokeWidth={41}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M715.24,1059.94c-26.77,5.28-54.44,8.04-82.76,8.04-204.91,0-376-144.82-416.49-337.7"
      />
      <path fill={sFill} d="M624.89,450.96v73.85h-169.55c-8.31,0-19.71,13.61-21.1,21.88-3.85,22.84,3.08,40.87,28.01,43.36,41.11,4.12,81.2-7.02,121.79,9.01,87.69,34.64,71.11,203.98-35.74,203.98h-197.1v-73.85h174.72c9.09,0,20.14-14.45,21.37-23.34,2.68-19.44-2.65-39.45-24.8-41.93-60.55-6.78-147.14,19.57-173.79-58.46-22.06-64.57,1.02-154.51,82.56-154.51h193.65Z" />
      <polygon fill={`url(#${uid}-k)`} points="792.86 803.02 913.22 803.02 757.19 627.48 912.67 450.98 793.81 450.98 640.43 627.48 792.86 803.02" />
    </svg>
  );
}

export default function SkillSnapLogo({
  variant = "full",
  size = "md",
  dark = false,
  anySurface = false,
}: LogoProps) {
  // useId() can contain ":" which is awkward inside url(#…) refs — strip it.
  const uid = useId().replace(/:/g, "");
  const tone: Tone = anySurface ? "brand" : dark ? "onDark" : "onLight";
  if (variant === "icon") return <Mark uid={uid} height={ICON_HEIGHTS[size]} tone={tone} />;
  return <Wordmark uid={uid} height={FULL_HEIGHTS[size]} tone={tone} />;
}

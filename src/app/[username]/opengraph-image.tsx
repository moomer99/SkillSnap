// ─────────────────────────────────────────────
// SkillSnap — Generated OG card  ( /@username/opengraph-image )
//
// Link previews used to point at the pro's raw cover photo; Facebook crops to
// 1.91:1 and beheads portrait shots. This renders a 1200x630 card instead, so
// nothing is ever cropped: avatar in a ring on the left, name / skill / bio on
// the right. Must never throw — a missing or broken profile gets a generic
// brand card so shared links always unfurl with *something*.
// ─────────────────────────────────────────────
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SkillSnap profile";

const BG = "#0d0a1a";
const PURPLE = "#6c47ff";
const MUTED = "#a1a1aa";

// Poppins is the site's display font (layout.tsx). Satori can't read the woff2
// files next/font caches, so the TTFs are vendored in src/app/fonts/ and read
// from disk — no network on the render path, so a crawler on a cold instance
// never waits on a font fetch. If the read fails we render with satori's
// built-in Geist Regular instead of failing the card. Paths stay literal so
// Next's file tracing bundles the fonts into the serverless output.
interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
}

let fontsPromise: Promise<OgFont[] | null> | null = null;

function loadFonts(): Promise<OgFont[] | null> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      try {
        const [regular, semibold] = await Promise.all([
          readFile(join(process.cwd(), "src/app/fonts/Poppins-Regular.ttf")),
          readFile(join(process.cwd(), "src/app/fonts/Poppins-SemiBold.ttf")),
        ]);
        return [
          { name: "Poppins", data: Uint8Array.from(regular).buffer, weight: 400, style: "normal" },
          { name: "Poppins", data: Uint8Array.from(semibold).buffer, weight: 600, style: "normal" },
        ] as OgFont[];
      } catch (err) {
        console.error("[og-image] font read failed, using default font:", err);
        fontsPromise = null;
        return null;
      }
    })();
  }
  return fontsPromise;
}

interface OgProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_initial: string | null;
  skill: string | null;
  bio: string | null;
}

/** Same shape rules as the page: "@handle" or "handle", [a-z0-9_.] only. */
function toHandle(segment: string): string | null {
  const decoded = decodeURIComponent(segment).trim();
  const handle = (decoded.startsWith("@") ? decoded.slice(1) : decoded).trim().toLowerCase();
  if (!handle || !/^[a-z0-9_.]+$/.test(handle)) return null;
  return handle;
}

async function getOgProfile(handle: string): Promise<OgProfile | null> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("profiles")
      .select("username, display_name, avatar_url, avatar_initial, skill, bio")
      .ilike("username", handle)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[og-image] profile query failed:", error.message);
      return null;
    }
    return (data as OgProfile | null) ?? null;
  } catch (err) {
    console.error("[og-image] profile query threw:", err);
    return null;
  }
}

/** Fetch the avatar into a data URI so satori never depends on a remote URL. */
async function fetchAvatarDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 8_000_000) return null;
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch (err) {
    console.error("[og-image] avatar fetch failed:", err);
    return null;
  }
}

/** "Makon Great" → "MG"; code-point aware so non-Latin names don't split. */
function initialsOf(name: string, stored: string | null): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();
  return fromName || (stored ?? "S").slice(0, 2).toUpperCase();
}

/** Long names shrink instead of overflowing; they also clamp to two lines. */
function nameFontSize(name: string): number {
  if (name.length <= 18) return 60;
  if (name.length <= 30) return 48;
  return 38;
}

function collapse(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** The favicon's SK mark: purple rounded tile, white S and arrow. */
function SkMark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 1080 1080">
      <rect width="1080" height="1080" rx="240" fill={PURPLE} />
      <path
        fill="#fff"
        d="M537.74,351.2v79.2h-181.84c-8.92,0-21.14,14.6-22.63,23.47-4.13,24.5,3.31,43.83,30.04,46.51,44.09,4.42,87.08-7.53,130.61,9.67,94.04,37.15,76.27,218.75-38.33,218.75h-211.38v-79.2h187.38c9.75,0,21.6-15.49,22.91-25.03,2.88-20.85-2.85-42.31-26.6-44.97-64.93-7.27-157.8,20.99-186.38-62.69-23.66-69.25,1.09-165.7,88.54-165.7h207.68Z"
      />
      <path
        fill="#fff"
        d="M717.87,728.78L846.96,728.78L679.62,540.52L846.37,351.22L718.89,351.22L554.4,540.52Z"
      />
    </svg>
  );
}

function CornerBrand() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 36,
        right: 44,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <SkMark px={40} />
      <span style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
        SkillSnap
      </span>
    </div>
  );
}

/** Fallback card for unknown handles and hard failures. */
function GenericCard({ fontFamily }: { fontFamily: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: BG,
        fontFamily,
      }}
    >
      <SkMark px={130} />
      <span style={{ fontSize: 58, fontWeight: 600, color: "#fff" }}>SkillSnap</span>
      <span style={{ fontSize: 28, color: MUTED }}>Watch. Trust. Connect.</span>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  let fontFamily = "Geist";
  try {
    const { username } = await params;
    const fonts = await loadFonts();
    if (fonts) fontFamily = "Poppins";
    const imageOptions = { ...size, fonts: fonts ?? undefined };

    const handle = toHandle(username);
    const profile = handle ? await getOgProfile(handle) : null;
    if (!profile) {
      return new ImageResponse(<GenericCard fontFamily={fontFamily} />, imageOptions);
    }

    const name = collapse(profile.display_name || profile.username, 70);
    const skill = profile.skill ? collapse(profile.skill, 40) : null;
    const bio = profile.bio ? collapse(profile.bio, 180) : null;
    const avatar = profile.avatar_url ? await fetchAvatarDataUri(profile.avatar_url) : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 64,
            padding: "0 90px",
            background: BG,
            fontFamily,
            position: "relative",
          }}
        >
          {avatar ? (
            <div
              style={{
                width: 232,
                height: 232,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 116,
                border: `4px solid ${PURPLE}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                width={208}
                height={208}
                style={{ width: 208, height: 208, borderRadius: 104, objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 232,
                height: 232,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 116,
                background: PURPLE,
                color: "#fff",
                fontSize: 88,
                fontWeight: 600,
              }}
            >
              {initialsOf(profile.display_name || profile.username, profile.avatar_initial)}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 22,
              // explicit width: satori/yoga doesn't reliably constrain block
              // text (lineClamp) inside a flex-grow column, so text overflowed
              // the right padding. 1200 − 90·2 (padding) − 232 (avatar) − 64 (gap)
              width: 724,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                // satori only honours lineClamp on display:block elements
                display: "block",
                width: "100%",
                fontSize: nameFontSize(name),
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.15,
                lineClamp: 2,
              }}
            >
              {name}
            </span>
            {skill && (
              <div
                style={{
                  display: "flex",
                  background: PURPLE,
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 600,
                  padding: "10px 26px",
                  borderRadius: 999,
                }}
              >
                {skill}
              </div>
            )}
            {bio && (
              <span
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: 26,
                  color: MUTED,
                  lineHeight: 1.45,
                  lineClamp: 2,
                }}
              >
                {bio}
              </span>
            )}
          </div>

          <CornerBrand />
        </div>
      ),
      imageOptions
    );
  } catch (err) {
    // Absolute backstop: a broken card must still unfurl as a brand card.
    console.error("[og-image] render failed:", err);
    return new ImageResponse(<GenericCard fontFamily={fontFamily} />, size);
  }
}

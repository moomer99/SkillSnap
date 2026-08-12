# Web ↔ Mobile Parity Audit

> **Run:** 2026-08-12 · **Web repo (SkillSnap)** at commit `bb1dc7d` · **Mobile repo (SkillSnapApp)** at commit `5719b27`
> Read-only audit comparing the web app against the mobile app as the design reference. No code was changed to produce it.

## Headline verdict

The **brand foundation is tightly matched** — same purple (`#6c47ff`), same dark base (`#0d0a1a`), the same new logo art everywhere (zero pre-rebrand art survived on either side), and the auth hero is a near-perfect port (icon+wordmark lockup, 22/800 headline, identical marquee pills). Where the two apps drift into feeling like *different products* is concentrated in four places: **onboarding copy, profile structure, the type system, and per-screen copy**. A large share of structural difference is **intentional** — web is a browse-only companion (no camera/upload, "get the app to post"), and Discover uses web maps vs native — so those are flagged as by-design rather than defects.

Rough parity on shared surfaces: **auth ~90%, chat ~85%, feed ~75%, messages ~70%, settings ~65%, profile ~60%, onboarding ~20%.**

## Discrepancies, ranked by severity

| Area | Mobile | Web | Sev | Recommendation |
|---|---|---|---|---|
| **Onboarding content** | 3 slides, the `Watch. / Trust. / Connect.` narrative, Ionicon glyphs | 4 slides, generic marketing (`Welcome to SkillSnap` / `Discover Talent` / `Share Your Skills` / `Attract Local Clients`), SVG art | **High** | Pick one canonical story. These share no words — a user who saw mobile onboarding will not recognise web's. Mobile's is on-brand with the tagline; port it. |
| **Profile stats & tabs** | 4 stats (`Jobs`/`Happy`/`Followers`/`Based`); 3 tabs (`Work`/`Jobs Done`/`Saved`) | 3 stats (`Jobs Done`/`😊 Happy`/`Connections`); 2 tabs (`My Works`/`Saved`), no Jobs-Done tab | **High** | Reconcile the stat set and the `Followers`↔`Connections` label; decide whether web surfaces a Jobs-Done tab. This is the most structurally divergent shared screen. |
| **Auth CTA / guest copy** | `Sign up with email`; submit `Sign up`; `Continue as Guest` + "Browse around without an account." | `Create Free Account`; submit `Create account`; `Browse without signing up` | **High** | Align to one wording set. Auth is the universal entry screen, so mismatched primary-button labels are the most-seen inconsistency. |
| **Type system (app-wide)** | No custom font at all — system default (SF / Roboto) at every weight | Geist for body, **Poppins on every `h1`–`h3`** heading | **High** | Brand-level decision: either load the web faces on mobile or accept system on both. Today web headings carry a distinct typographic voice mobile lacks entirely. (Auth hero is exempt — it's `<p>`/Geist, a faithful port.) |
| **Primary / Connect button fill** | **Solid** `#6c47ff` (Connect, Discover CTAs) | **Diagonal gradient** `#6c47ff→#8b6af5` on nearly all CTAs | **Med** | Most-used, most-repeated visual mismatch. Choose solid or gradient as the canonical primary and apply platform-wide. |
| **Sign-up form behaviour** | Has **Confirm Password** + required **Terms checkbox** | Neither field present | **Med** | Not just copy — a legal/validation gap. Decide whether web needs the explicit terms consent and confirm-password to match mobile's account-creation contract. |
| **Feed model & empties** | Full-screen paged video (TikTok-style); radius `[2,5,10,25,50]`; empty `No posts yet. Be the first to post!` | Document-scroll cards ≤600px; radius `[5,10,25,50]`; empty `Welcome to SkillSnap / Set your location…` | **Med** | Interaction model is intentionally platform-shaped, but align the radius options (mobile's 2 km is missing on web) and the empty-state wording. |
| **Settings structure & rows** | Theme toggle (System/Light/Dark), `Change Email`, `Blocked Accounts`, `Feedback`, `How to use SkillSnap`; 2 legal rows | Pro banner + profile card (web-only), `Profile Visibility (Soon)`; theme toggle absent (dark-only); 1 combined legal row | **Med** | Some gaps are by design (no theme toggle — web is dark-only). Reconcile the genuinely-shared rows and labels (`Help Center`↔`Help & FAQ`, one vs two legal rows). |
| **Surface / border tokens** | Solid hex: surface `#171327`, surfaceAlt `#221d38`, border `#2a2440`, muted `#a8a29c` | Alpha model: surface `#16122a`, surface-2 `#1c1733`, border `rgba(255,255,255,.10)`, muted `rgba(255,255,255,.60)` | **Med** | Same intent, different rendered values — and web uses alpha overlays where mobile uses solids, so "matching" roles resolve differently. Pick one source of truth per role. |
| **Hardcoded hex on web** | Centralised: 2 palettes in `constants/colors.ts` via `useTheme()` | ~938 raw hex/rgba across 38 files; `--ss-*` tokens largely bypassed; light mode wired only on the landing page | **Med** | The root cause of all colour drift and the reason future divergence is likely. Consolidating onto the tokens is the highest-leverage maintainability fix. |
| **Loading states** | Native `ActivityIndicator` throughout; no skeletons | Skeleton cards + CSS/lucide spinners | **Med** | Convention differs per platform; acceptable, but worth a deliberate call so the perceived-load feel is consistent. |
| **Messages copy & banners** | `Search messages…`; empty `Connect with a pro to start chatting`; no inline banners | `Search by name, skill or location…`; empty `Tap Connect on a skiller's profile…`; adds notif + Jobs-Done banners | **Med** | Align the search placeholder and empty subtitle; the extra web banners are additive and fine. |
| **Corner-radius drift** | Buttons/cards cluster at **12–14** | Branded set standardises on **16** (`rounded-2xl`) | **Low** | Pick one radius scale. Chips already agree (pill); it's buttons/cards that split. |
| **Size / weight rounding** | Free scale (11/13/15/17); labels & buttons often **700** | Tailwind steps (12/14/16); many labels drop to **600** | **Low** | Systemic −1px/−1weight drift from web snapping to Tailwind's fixed scale. Cosmetic but pervasive. |
| **Avatar fallback** | Solid brand-purple + initial | Per-user stored **gradient** + initial | **Low** | Minor; decide one fallback treatment. |
| **Discover chip treatment** | Border + elevation (shadow) | Flat, no border/shadow | **Low** | Cosmetic chip-styling gap. |
| **Copy nits** | `Discover real skills near you.` (period); `v1.0.0`; `Remember my login`; login placeholder `Enter your password` | `…near you` (no period); `v1.0`; `Remember my email`; `Your password` | **Low** | Trivial individually; worth a single copy-consistency pass across the whole app. |
| **Apple Sign In** | Present (iOS) | Absent | **Low** | Expected platform difference — flagging only for completeness. |
| **Duplicate icon asset** | — | `logo-icon.svg` and `skillsnap-icon.svg` are byte-identical | **Low** | Consolidate to one filename; not a branding defect. |

## What's already solid (keep)

- **Colour anchors:** brand purple, dark bg, light bg, primary text — exact matches.
- **Logo:** same new mark + wordmark, same roles; the **auth icon-over-wordmark lockup is identical** on both.
- **Auth hero:** headline 22/800/#fff and marquee pills match to the pixel/value.
- **Chat Jobs-Done flow + suggested openers:** deliberately kept in sync — the model to follow for everything else.

## Root cause worth naming

The colour, radius, and size drift all trace to the same thing: **mobile routes every value through tokens; web defines a clean `--ss-*` system and then bypasses it ~938 times with hardcoded literals.** Fixing per-screen symptoms will keep re-drifting until web actually consumes its own tokens. That's the single highest-leverage item — not user-visible on its own, but it's why the two products keep separating.

Prevalence of the specific brand literals on web (occurrences / files):

- **`#6c47ff`** (brand purple, should be `--ss-purple`/`--primary`): 234 / 45 files.
- **Dark surfaces** `#0d0a1a/#16122a/#1c1733/#1a0f3c/#241d40` (should be `--ss-bg`/`--ss-surface`/…): 215 / 32 files.
- **`rgba(255,255,255,x)`** (should be `--ss-line`/`--ss-text-*`): 89 / 17 files.
- **Pale-purple ramp** `#a78bfa/#c4b5fd/#ddd6fe/#ede9fe` (should be `--ss-purple-light`/chart tokens): 80 / 25 files.

Mobile, by contrast, centralises colour in `src/constants/colors.ts` (two palettes) consumed via `useTheme()`/`useThemedStyles()`; the only legitimate hardcoded values live in `alwaysDark` (`#000000`, `#0d0a1a`) for full-bleed video/splash.

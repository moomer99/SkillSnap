# Web light theme — switched off for launch, debt list

> A copy of this record also lives in the SkillSnap Claude project as
> `claude/web-light-theme-debt.md`; update both or neither.

**Status (19 Aug 2026):** light mode is switched OFF, not removed. Kill switch:
`LIGHT_THEME_ENABLED = false` in `src/hooks/useTheme.ts`. While it is false:

- `useTheme()` reports `"dark"` on server and client; the stored
  `localStorage["skillsnap-theme"]` is neither adopted nor overwritten;
  `setTheme` / `toggleTheme` are inert.
- The pre-paint script in `src/app/layout.tsx` applies `dark` unconditionally
  (original line kept there as a comment).
- `shared/ThemeToggle.tsx` returns `null` inside the component, so its call
  sites (`LandingPage.tsx` desktop + mobile nav) keep compiling.

**To bring light back:** flip the flag to `true`, restore the original
pre-paint line in `layout.tsx`, then work through the list below. The light
palette (`html.light` in `globals.css`), the toggle and all component styling
are intact.

## Two failure patterns, not one

Both produce invisible text, and they need opposite fixes. Telling them apart
is the whole job — fixing one with the other's remedy makes it worse.

**Pattern A — hard-coded dark surface, theme-token children.** The background
is a fixed dark hex; the text reads `var(--ss-*)`, which flips dark in light
mode. Dark on dark.

- `BottomNav.tsx` — bar is `rgba(22,18,42,0.96)`; inactive items are
  `var(--ss-text-dim)`. Three of the four tabs are invisible in light mode:
  only Home shows, because it is active and uses `--ss-purple-light`.
- `HomeFeed.tsx` feed header and post card — both fixed `#0d0a1a`. The card
  was fixed in `79921c6` by pinning its foregrounds; the header has not been
  audited.
- `globals.css` `.leaflet-control-attribution` — `rgba(13,10,26,0.72)
  !important` with `color: var(--ss-text-dim) !important`.

*Remedy:* pin the foreground to an explicit light-on-dark value. The dark-theme
resolutions are `--ss-text-dim` -> `rgba(255,255,255,0.40)` and `--ss-line` ->
`rgba(255,255,255,0.10)`, so substituting those leaves dark mode byte-identical.

**Pattern B — theme-token surface, hard-coded dark children.** The inverse, and
the expensive one. The surface follows the theme (white in light mode) while
every child is a literal dark-palette hex. White on white.

- `shared/LocationPickerSheet.tsx` is the reference case. The sheet is
  `var(--ss-surface)`, but its children are `text-[#ffffff]` headings,
  `text-[#9d97b5]` body copy, `bg-[#16122a]` quick-pick chips and
  `border-[#26203f]` outlines. In light mode the "Set Your Location" heading
  and the "Use My GPS Location" label disappear and the suburb chips become
  dark blobs on white.

*Remedy:* replace the hard-coded hexes with tokens. `grep -rn "text-\[#\|bg-\[#\|border-\[#" src/components/skillsnap/` generates the work list.

## The pattern to port

The mobile app already solved this. `SkillSnapApp/src/constants/colors.ts`
exports `lightPalette` / `darkPalette` *plus* an explicit `alwaysDark` set for
surfaces that are dark by design rather than by theme — video background, brand
splash, feed placeholder — and `ThemeContext.tsx` resolves the active palette
once for every screen through `useThemedStyles`. The web has the palette half
but no `alwaysDark` equivalent, which is why fixed-dark chrome and theme tokens
keep colliding here. Add that second tier before working the list.

## Other entry points checked (19 Aug)

No settings row, no sidebar toggle, no direct `setTheme("light")` anywhere;
`components/ui/sonner.tsx` imports `next-themes` but is unused.

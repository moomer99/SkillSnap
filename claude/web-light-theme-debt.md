# Web light theme — switched off for launch, debt list

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

## Known light-mode defects (why it was switched off)

- `BottomNav.tsx` — inactive items painted `var(--ss-text-dim)`, which
  resolves dark on the bar's hard-coded `rgba(22,18,42,0.96)`: three of the
  four tabs invisible in light mode.
- `shared/LocationPickerSheet.tsx` — "Set Your Location" heading and "Use My
  GPS Location" label use theme tokens on a fixed-dark sheet.
- Feed header (`HomeFeed.tsx`) is fixed dark `rgba(13,10,26,0.90)`; the card
  body was fixed in `79921c6` (fixed light-on-dark values) but other fixed-dark
  surfaces still read theme tokens.
- General rule for the audit: any surface with a hard-coded dark background
  must not read `--ss-text-*` / `--ss-line` — either theme the background too
  or pin the foreground.

## Other entry points checked (19 Aug)

No settings row, no sidebar toggle, no direct `setTheme("light")` anywhere;
`components/ui/sonner.tsx` imports `next-themes` but is unused.

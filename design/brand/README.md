# Brand source SVGs

Source artwork for the SkillSnap logo. **Not served** — these live outside
`public/` on purpose (anything in `public/` is publicly fetchable).

The logo is **inlined** in `src/components/skillsnap/shared/SkillSnapLogo.tsx`
(so it paints on first render and follows the `dark` / `anySurface` props).
These files are the source to regenerate that component from if the artwork
changes.

- `wordmark-*` / `mark-*` `-dark-surface`  — white letters/S + gradient K (on dark)
- `*-light-surface`                        — solid #0d0a1a (on light)
- `*-any-surface`                          — brand #6c47ff (theme-proof)
- `wordmark.svg` / `wordmark-gradient.svg` — full gradient, marketing only (fails WCAG on both surfaces; not used in-app)
- `wordmark-white.svg`                     — solid white fallback

Still-served logo files remain in `public/`: `skillsnap-icon.svg`,
`logo-icon.svg`, `favicon.svg`.

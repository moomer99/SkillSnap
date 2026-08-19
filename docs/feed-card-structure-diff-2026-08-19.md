# Feed card structure diff — app vs web — 19 Aug 2026

> **Scope:** observed structure only, read from code. App = `SkillSnapApp/src/components/VideoCard.tsx` (2011 lines, render at 952–1620). Web = `SkillSnap/src/components/skillsnap/HomeFeed.tsx` `FeedCard` (738–1237, before today's fixes). Not a judgement about which is right.
> **Fixed today (commits on `master`):** A) multi-photo pager (`5900c04`, `beb3244`), B) Connect position (`1fddc35`), then C) author row moved below the media with Connect back on it (`f7a4f96`), D) stats row: Happy "New", zero Jobs Done/Followers hidden, short row centred (`995ba79`). Everything else here is unchanged and is for Mo to choose from.

## Vertical order, top to bottom

| # | App (VideoCard.tsx) | Web (FeedCard, before fix) |
|---|---|---|
| 1 | **Media box** — fixed height `72% of viewport` (`VIDEO_HEIGHT_RATIO`), full-bleed width | **Media box** — height from the media's own aspect, clamped 4:5 … 16:9, full card width |
| 2 | *(over media, top-left)* **Skill chip** — post skill, emoji + label, coloured pill | *(no skill chip over the media)* — `author.skill` is a small purple pill **beside the name in the author row** (see 7) |
| 3 | *(over media, top-right)* **Sound toggle** — video only, icon **plus "Sound off / Sound on" label** | *(over media, top-right)* **Sound toggle** — video only, icon only, no label |
| 4 | *(over media, right edge, bottom 20)* **Rail**: Like (thumbs-up) → Comment → **Recommend** (paper-plane) → **Save** → More (⋯) — icons + counts, no words | *(over media, right edge, bottom)* **Rail**: Like (heart) → Comment → **Save** → **Recommend** (send) → More (⋯) — Save and Recommend are swapped relative to the app |
| 5 | *(over media, bottom-centre, 12 px up)* **Carousel dots** — photo sets only, `pointerEvents="none"`, report position; swipe moves pages | *(over media, above the author row)* **Carousel dots** — clickable buttons; the only way to change page (no pager) |
| 6 | *(over media, bottom edge)* **Video progress track** — video only | *(none)* |
| 7 | **Below media — info section, card surface colour:** **Author row** — avatar (lifted −28 px over the media edge) · display name · verified tick · **availability badge** · location line · **Connect** at the right end of the row (text pill; hidden on own post) | ***Overlaid on media, bottom-left:*** **Author row** — avatar · display name · `author.skill` pill · 📍 distance + location · **Connect** at the right end of the same overlaid row (hidden on own post) |
| 8 | **Below** — Caption, 2 lines collapsed, inline "… more / less" | **Below media** — Caption, 2 lines collapsed, inline "… more" (`FeedCaption`) |
| 9 | *(no timestamp on the card)* | **Timestamp** ("3h ago") below the caption |
| 10 | **Below** — **Stats box**: bordered, filled panel; 4 columns each with an **icon square** + value + label: Jobs Done · Happy · **Away** (when distance known, else Location; tappable → Maps) · Followers. Hidden when all four empty | **Below** — **Stats row**: plain, no border, no icons: Jobs Done · Happy · Location · Followers, with thin dividers. Hidden when all four empty |
| 11 | Overflow menu = More on the rail → `PostActionsSheet` (owner: edit/delete/toggle comments; other: report) | Overflow menu = More on the rail → in-card sheet (owner: edit caption/skill/location, delete; other: follow, view profile, full screen, share profile) |
| 12 | Card outer: 8 px top / 12 px bottom padding on background colour, card surface below | Card: flat `#0d0a1a` with a 1 px hairline bottom border |

## Overlaid vs stacked, per element

| Element | App | Web (before fix) |
|---|---|---|
| Skill chip | overlaid, top-left | (beside name; overlaid, bottom-left) |
| Sound toggle | overlaid, top-right, with label | overlaid, top-right, icon only |
| Author row (avatar/name/location) | **stacked below media** | **overlaid on media, bottom-left** → **moved today** below the media (`f7a4f96`) |
| Connect | **stacked below media**, right end of author row | **overlaid on media**, bottom-right, right end of the overlaid author row → **moved today** to sit right-aligned in a row directly under the media |
| Caption | stacked | stacked |
| Timestamp | absent | stacked, under caption |
| Stats row | stacked, boxed with icons | stacked, plain |
| Rail | overlaid, right, bottom | overlaid, right, bottom |
| More / overflow | on the rail | on the rail |
| Carousel dots | overlaid, bottom-centre, passive | overlaid above author row, clickable → **now passive + synced to a real pager** |
| Video progress bar | overlaid, bottom edge | absent |

## Cause of the multi-photo bug (measured from code)

`FeedCard` never had a pager: it rendered **one** `<img>` for `mediaItems[activeMediaIndex]` (`activeMediaUrl`), and the dots were buttons that changed the index. Nothing to scroll, no `overflow`, no `scroll-snap`, and nothing swallowing touch — the track simply did not exist. Fixed by rendering all items in a horizontal scroll-snap track (touch native, mouse drag + arrows on desktop) with dots driven from `scrollLeft`. The frame keeps page 1's aspect across pages (like the app's fixed media box); each later page letterboxes or fills inside it — an earlier revision re-framed per page and shrank the card 549→247 px mid-swipe on driveroncall9's portrait+landscape set (`beb3244` fixed it).

**Verified 19 Aug** on skillsnap-beta (Chrome, 439 px window, mobile layout) with the real post: scrollLeft 0 → 439 → 879 → 439 by mouse drag, dots 1→2→3→2, frame 549 px throughout, Connect below the media. Desktop (600 px card, arrows + drag + dot click) verified on the local dev server with a temporary 3-photo mock post.

## Round 2 (f7a4f96, 995ba79) — measured on skillsnap-beta, before → after

| | Driver-on-call (zero stats) | Adam S (6 / 100% / 8) |
|---|---|---|
| desktop 600 px card | 935 → 935, media 750 → 750 | 912 → 912, media 750 → 750 |
| 375 | 650 → 650, media 465 → 465 | 650 → 650, media 465 → 465 |
| stats after | Happy=New · Location=Casula, centred | Jobs Done=6 · Happy=100% · Location=Bankstown · Followers=8 |

Avatar top sits 16 px above the media's bottom edge; name and Connect start 10 px below it, at both widths. Scrim: bottom softened 0.78 → 0.45 (the app's) — kept for the overlaid rail and dots. Dots at bottom centre of the media.

## Left for Mo to choose from (not changed)

- Name truncates at 375 when the skill pill and Connect crowd it ("Marcus Thomp…") — same rule as the app's `numberOfLines={1}`, but the app has no skill pill on that row.
- Name/location still carry the overlay-era text-shadow now that they sit on the flat card (position-only was the brief).
- **Pre-existing, light theme only:** stat labels (JOBS DONE etc.) and the timestamp use `var(--ss-text-dim)`, which is a light-theme dim colour on the hard-coded dark card — near-invisible in light theme, fine in dark.
- Skill chip: top-left over media (app) vs pill beside the name (web).
- Rail order: Save/Recommend swapped; Like glyph heart vs thumbs-up; sound-toggle label.
- Stats box styling (icons, border, "Away" column with Maps tap) vs plain row.
- Timestamp present on web only. Video progress bar present on app only.
- Overflow menu contents differ (web: follow / view profile / full screen / share; app: report; owner: web has per-field edits, app has one Edit).

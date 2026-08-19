# Feed card structure diff — app vs web — 19 Aug 2026

> **Scope:** observed structure only, read from code. App = `SkillSnapApp/src/components/VideoCard.tsx` (2011 lines, render at 952–1620). Web = `SkillSnap/src/components/skillsnap/HomeFeed.tsx` `FeedCard` (738–1237, before today's fixes). Not a judgement about which is right.
> **Fixed today (commits on `master`):** A) multi-photo pager, B) Connect position. Everything else here is unchanged and is for Mo to choose from.

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
| Author row (avatar/name/location) | **stacked below media** | **overlaid on media, bottom-left** |
| Connect | **stacked below media**, right end of author row | **overlaid on media**, bottom-right, right end of the overlaid author row → **moved today** to sit right-aligned in a row directly under the media |
| Caption | stacked | stacked |
| Timestamp | absent | stacked, under caption |
| Stats row | stacked, boxed with icons | stacked, plain |
| Rail | overlaid, right, bottom | overlaid, right, bottom |
| More / overflow | on the rail | on the rail |
| Carousel dots | overlaid, bottom-centre, passive | overlaid above author row, clickable → **now passive + synced to a real pager** |
| Video progress bar | overlaid, bottom edge | absent |

## Cause of the multi-photo bug (measured from code)

`FeedCard` never had a pager: it rendered **one** `<img>` for `mediaItems[activeMediaIndex]` (`activeMediaUrl`), and the dots were buttons that changed the index. Nothing to scroll, no `overflow`, no `scroll-snap`, and nothing swallowing touch — the track simply did not exist. Fixed by rendering all items in a horizontal scroll-snap track (touch native, mouse drag + arrows on desktop) with dots driven from `scrollLeft`.

## Left for Mo to choose from (not changed)

- Author row overlaid on media (web) vs stacked below the media (app).
- Skill chip: top-left over media (app) vs pill beside the name (web).
- Rail order: Save/Recommend swapped; Like glyph heart vs thumbs-up; sound-toggle label.
- Stats box styling (icons, border, "Away" column with Maps tap) vs plain row.
- Timestamp present on web only. Video progress bar present on app only.
- Overflow menu contents differ (web: follow / view profile / full screen / share; app: report; owner: web has per-field edits, app has one Edit).

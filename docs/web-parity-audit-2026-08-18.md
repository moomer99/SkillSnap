# Web parity audit — 18 Aug 2026

> **Scope:** read-only audit of the web repo (`SkillSnap`, branch `master` @ `f93a84b`) against today's mobile fixes (`SkillSnapApp`). No code was changed. Decide what to apply afterwards.
> **Legend:** **MEASURED** = read from code / captured from a command / fetched over HTTP in this session. **INFERRED** = assumed or computed from typical inputs; not observed.
> Related, different scope: `docs/web-mobile-parity-audit.md` (design parity, 12 Aug).

---

## Part 1 — Image handling

### 1.1 Does the web use any Supabase transform? — MEASURED: **No.**

- `src/constants/config.ts:46` — `BUCKET_URL: "https://dnraeyxjzdmpdvrkzyfd.supabase.co/storage/v1/object/public"`. It is declared and **never imported** anywhere in `src/` (only hit is its own definition).
- The real URL source at runtime is `getPublicUrl()` in `src/services/uploadService.ts:9-14` (→ `/storage/v1/object/public/...`) and, for chat, `createSignedUrl(path, 3600)` in `src/services/messageService.ts:263` with **no `transform` option**.
- `grep -rn "render/image" src/` → no output. No URL contains `/storage/v1/render/image`; no `?width=`, `?quality=`, `resize=` is appended anywhere. The only appended query in the codebase is the `?t=${Date.now()}` avatar cache-buster at `uploadService.ts:67`.
- The only two `next/image` call sites both pass `unoptimized` and neither sets `sizes` (`shared/UserAvatar.tsx:60`, `HomeFeed.tsx:535`). No custom image `loader`. So the Next optimiser is bypassed as well: **every Supabase-hosted byte is served at original resolution.**

### 1.2 Two structural amplifiers (MEASURED)

1. **Photo posts have no thumbnail.** `src/services/uploadService.ts:122-123` — `if (file.type.startsWith("image/")) thumbnailUrl = url;` → `thumbnail_url === media_url === the original upload`. Every "thumbnail" render site (grid tiles, landing mockup) serves the 10 MB-ceiling original.
2. **Video posters are native-resolution JPEGs.** `UploadScreen.tsx:81-87` — canvas sized to `vid.videoWidth/videoHeight`, `toDataURL("image/jpeg", 0.85)`, uploaded unchanged. (Same defect the mobile side fixed today with `VIDEO_THUMBNAIL_MAX_EDGE`.)

Also relevant: in-app post media (not avatars) is re-pointed through `${origin}/supabase/...` by `proxyMediaUrl()` — see Part 3(e). Any transform URL would need to keep that prefix (`/supabase/storage/v1/render/image/public/...`), which the `:path*` rewrite already covers.

Upload ceilings, no downscale anywhere (MEASURED): post photo 10 MB / video 60 MB (`UploadScreen.tsx:49-50`); avatar 5 MB (`EditProfileScreen.tsx:72-77`); **chat image: no size limit at all** (`ChatScreen.tsx:937-944` → `messageService.uploadChatImage`).

### 1.3 Every render site of Supabase-hosted media

Display sizes marked (M) are read from Tailwind classes / props; (I) are computed from container math or assumed originals.

| # | File : line | Element | URL source | Displayed | Downloaded |
|---|---|---|---|---|---|
| 1 | `src/components/skillsnap/shared/UserAvatar.tsx:54-62` | `next/image`, `width/height=PX_MAP[size]` (28/36/48/80), `unoptimized`, no `sizes` | `profiles.avatar_url` (direct, not proxied) | 28–80 px (M) | full original avatar, ≤5 MB (M limit) |
| 2 | `src/components/skillsnap/HomeFeed.tsx:877-892` | raw `<img loading="lazy">` | `post.mediaItems[i].url ?? post.mediaUrl` (proxied) | ≤600 px wide (M) | full original photo, ≤10 MB |
| 3 | `HomeFeed.tsx:860-875` | `<video preload="metadata" poster=thumbnailUrl>` | proxied | ≤600 px (M) | native-res JPEG poster (I ~250–600 KB); video on play |
| 4 | `HomeFeed.tsx:535` | `next/image fill object-contain unoptimized` | `post.thumbnailUrl` | full viewport (M) | original |
| 5 | `HomeFeed.tsx:524-532` | `<video preload="auto" poster>` | `post.mediaUrl` | full viewport (M) | **whole video file** (`preload="auto"`), ≤60 MB |
| 6 | `HomeFeed.tsx:578`, `:1002` | `<UserAvatar size="sm">` → #1 | `post.author.avatarUrl` | 36 px (M) | full avatar × every card |
| 7 | `src/components/skillsnap/ProfileScreen.tsx:311` (GridTile) | raw `<img>` — **no `loading="lazy"`** | `thumbnailUrl \|\| mediaUrl` | ~198 px tile (I: `grid-cols-3` in 600 px column) | original |
| 8–10 | `ProfileScreen.tsx:354,357,358` (MediaViewer) | `<video poster>` / raw `<img>` ×2 | mediaUrl / thumbnailUrl | full viewport (M) | original |
| 11 | `ProfileScreen.tsx:115` | `<UserAvatar size="lg">` | avatarUrl | 80 px (M) | full avatar |
| 12 | `src/app/[username]/WorkGrid.tsx:33-38` | raw `<img loading="lazy">` (SSR) | `visible_posts.thumbnail_url` (direct) | ~110 px mobile / ~217 px desktop (I) | original × **up to 60 tiles** (`page.tsx:70 .limit(60)`) |
| 13 | `WorkGrid.tsx:78-85` | `<video autoPlay controls poster>` | `media_url` | `max-w-[420px]` (M) | original |
| 14 | `WorkGrid.tsx:88-92` | raw `<img>` lightbox | `media_url ?? thumbnail_url` | `max-w-[420px]` (M) | original |
| 15 | `src/app/[username]/page.tsx:224-230` | raw `<img width=112 height=112>` | `profile.avatar_url` | 96/112 px (M) | full avatar |
| 16 | `page.tsx:108,121,127,160` | OG / Twitter / JSON-LD image | `profile.avatar_url` declared 1200×630 | social card | crawlers pull full avatar |
| 17 | `src/components/skillsnap/DiscoverScreen.tsx:410-414` | raw `<img>` pro card | `pin.avatarUrl` | 56 px (M) | full avatar × every card |
| 18 | `src/components/skillsnap/DiscoverMap.tsx:49-60` | `document.createElement("img")` in Leaflet `divIcon` | `pin.avatarUrl` | ~38 px in 42 px icon (M) | full avatar × **every pin, all built eagerly** in `useMemo` (line 92) |
| 19 | `src/components/skillsnap/ChatScreen.tsx:683,822` → `ChatImage:1176` | raw `<img>` | signed URL, no transform | `max-w-[220px]`, `maxHeight:260` (M) | original — **no upload cap** |
| 20 | `ChatScreen.tsx:1049` | raw `<img>` | participant avatar | 40 px (M) | full avatar |
| 21 | `ChatScreen.tsx:564` | `<UserAvatar size="sm">` | avatarUrl | 36 px (M) | full avatar |
| 22 | `src/components/skillsnap/RightSidebar.tsx:166-170` | raw `<img>` | `currentUser.avatarUrl` | 48 px (M) | full avatar |
| 23 | `RightSidebar.tsx:219` | raw `<img>` | suggested pros | 40 px (M) | full avatar × N |
| 24 | `src/components/skillsnap/LandingPage.tsx:344-349` | raw `<img loading="lazy">` phone mockup | `posts.thumbnail_url` | ~216–280 px (M) | original photo / native poster |
| 25 | `LandingPage.tsx:371` | raw `<img loading="lazy">` | `pro.avatarUrl` | **28 px** (M) | full avatar |
| 26 | `src/components/skillsnap/EditProfileScreen.tsx:244` | raw `<img>` | `user.avatarUrl` (then `blob:`) | 96 px (M) | full avatar on first paint |
| 27–29 | `SearchScreen.tsx:423`, `SettingsScreen.tsx:127`, `shared/MessageThreadItem.tsx:21` | `<UserAvatar size="md">` | avatarUrl | 48 px (M) | full avatar × row |

Non-Supabase (excluded, listed for completeness): local SVG logos (`page.tsx:154`, `AuthScreen.tsx:544`, `RoleSetupScreen.tsx:65`, `AuthPromptModal.tsx:27`, `AboutScreen.tsx:26`); `api.qrserver.com` QR at `RightSidebar.tsx:272-278` (already 120×120); `blob:` previews in `UploadScreen.tsx:218-233,283`; `DiscoverScreen.tsx:324` `backgroundImage` is a CSS gradient. There is no other `background-image` in `src/`.

### 1.4 Ranked by wasted bytes

Ratio = assumed original longest edge ÷ (CSS px × 2 for DPR). Assumed originals — avatar ~3024 px / 2.5 MB, post photo ~4032 px / 4 MB — are **INFERRED**; display px are **MEASURED**. Today's mobile measurement (2,522 KB → 378 KB at width=1080, resize=contain) is the only measured byte figure and it is for one photo.

| Rank | Site | Display | Over-fetch (linear) | Multiplier |
|---|---|---|---|---|
| 1 | #25 LandingPage:371 avatar | 28 px | ~54× | above the fold on the public homepage |
| 2 | #6 HomeFeed author avatar | 36 px | ~42× | × every feed card — **largest aggregate** |
| 3 | #18 DiscoverMap pin avatars | ~38 px | ~40× | × every pin, eager, no lazy option on `divIcon` |
| 4 | #20 ChatScreen:1049, #23 RightSidebar:219 | 40 px | ~38× | sidebar × N pros |
| 5 | #21/#27/#28/#29 UserAvatar sm/md | 36–48 px | ~31–42× | × every list row |
| 6 | #17 DiscoverScreen pro-card avatar | 56 px | ~27× | × every card |
| 7 | #12 WorkGrid public-profile tiles | ~110/217 px | ~18× | **60 tiles** — worst single-page payload |
| 8 | #7 ProfileScreen grid tiles | ~198 px | ~10× | no `loading="lazy"` |
| 9 | #1 lg / #15 / #26 avatars | 80–112 px | ~13–19× | one per page |
| 10 | #19 ChatImage | 220 px | ≥9×, unbounded | no upload cap |
| 11 | #24 LandingPage mockup | ~216–280 px | ~7–9× | homepage hero |
| 12 | #2 HomeFeed photo | ≤600 px | ~3.4× (≈11× pixels) | × every photo post |
| 13 | #3 HomeFeed video poster | ≤600 px | ~2–3× | fetched for every video card pre-play |
| 14 | #5 HomeFeed `preload="auto"` | fullscreen | n/a — pulls whole file | not a resize issue; separate fix |
| 15 | #4, #8–10, #13, #14, #16 | viewport | ~2–4× | legitimate full-res, low priority |

**Not implemented. Recommendation for later:** one helper mirroring mobile's `storageImage.ts` (render endpoint + `resize=contain` + onError fallback + session flag), applied first to `UserAvatar` (covers ranks 2, 5, 9 in one place) and to the grid tiles (ranks 7, 8). Transformations are confirmed enabled on the project by mobile's direct HTTP GET today (MEASURED on mobile side, not re-measured here).

---

## Part 2 — Build and type safety

**MEASURED**, `npx tsc --noEmit -p tsconfig.json` on `master @ f93a84b`, 18 Aug 2026: exit code **2**, **84 errors** in **17 files**. `next.config.ts` has `typescript.ignoreBuildErrors: true`; `package.json` scripts are `dev`, `build`, `start`, `lint` — no typecheck script.

By file:

| Errors | File |
|---|---|
| 15 | `src/components/skillsnap/ChatScreen.tsx` |
| 14 | `src/services/messageService.ts` |
| 11 | `src/services/jobsDoneService.ts` |
| 10 | `src/components/skillsnap/MessagesScreen.tsx` |
| 7 | `src/services/postService.ts` |
| 7 | `src/mock-data/users.ts` |
| 5 | `src/services/uploadService.ts` |
| 3 | `src/services/userService.ts` |
| 3 | `src/components/skillsnap/ProScreen.tsx` |
| 2 | `src/services/authService.ts` |
| 1 each | `ErrorReporter.tsx`, `SearchScreen.tsx`, `HomeFeed.tsx`, `BottomNav.tsx`, `useProfile.ts`, `UsernameSetupScreen.tsx`, `SettingsScreen.tsx` |

By code: TS2339 ×38, TS2345 ×23, TS2769 ×14, TS2741 ×7, TS2554 ×1, TS2322 ×1.

**Root cause (MEASURED):** 51 of 84 mention `'never'`. `src/lib/database.types.ts` is a **177-line hand-written** file (header: "Auto-generate with: npx supabase gen types…" but it was not), with `Functions: Record<string, never>` and no `Relationships`/`__InternalSupabase` shape. Current supabase-js generics collapse every `.insert()/.update()/.rpc()` and many row reads to `never` — including for tables the file *does* declare (`profiles`, `posts`, `messages`, `notifications`, `jobs_done`, `post_media`) and for ones it does not (`ratings`, every RPC). The other ~33 are ordinary type drift: `src/mock-data/users.ts` missing `role` (TS2741 ×7), `ErrorReporter.tsx:14` `useRef<NodeJS.Timeout>()` needs an argument under React 19 types (TS2554), one `Dispatch<Action>` mismatch, misc property-on-`never` in screens.

**INFERRED size of the hole:** regenerating `database.types.ts` (`supabase gen types typescript`) would likely clear ~50–60 of the 84 in one step; the remainder are small local fixes. Not done — audit only.

---

## Part 3 — Things in the production layout that need explaining

All in `src/app/layout.tsx`, `master @ f93a84b`. **None of (a)–(c) is gated to development** — every one ships in the production bundle. (MEASURED: no `NODE_ENV` check around them; only `<GoogleAnalytics>` at line 116 is gated.)

### (a) `<Script src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js">` — `layout.tsx:98-107`

- **MEASURED** — fetched 18 Aug 2026: `200`, `text/javascript`, 4,232 bytes, `Last-Modified: Sun, 27 Jul 2025`, ETag `de1c0087…`. Full source read. Not this project's Supabase (`dnraeyxjzdmpdvrkzyfd`); it is a **third-party bucket** (Orchids' hosting, INFERRED from the `orchids-visual-edits` pairing and the "YourApp" placeholder data).
- **What it does:** defines `RouteMessenger`, reads its options from the `<script>` tag's `data-*` attributes, and on route change `window.parent.postMessage({type: messageType, data: {pathname, search, fullUrl, timestamp, origin, ...customData}}, targetOrigin)`. It monkey-patches `history.pushState`/`replaceState`, listens to `popstate`/`hashchange`, **and polls `location` every 1000 ms with `setInterval`**. Exposes `window.routeMessenger` and `window.initRouteMessenger`.
- **data-\* attributes as set in layout:** `data-target-origin="*"` (post to any parent origin), `data-message-type="ROUTE_CHANGE"`, `data-include-search-params="true"` (**query strings included** — e.g. `?code=` on auth callbacks would be forwarded to the parent), `data-only-in-iframe="true"`, `data-debug="true"`, `data-custom-data='{"appName":"YourApp","version":"1.0.0","greeting":"hi"}'` (template placeholders, never customised).
- **Runs outside an iframe?** With `onlyInIframe: true` the `init()` returns early when `window.self === window.top`, so on a normal top-level visit it: downloads 4 KB from a foreign origin, patches nothing, sends nothing. **In any iframe embed** (any embedder, any origin, because `targetOrigin="*"`) it broadcasts every path + query string of the logged-in user's session to the embedding page.
- **Risk:** it is a remotely hosted script under someone else's control loaded on every production page; its content can change without a deploy here (supply-chain surface). Same-origin CSP is absent so nothing blocks it.
- **What breaks if removed:** nothing in this repo references `window.routeMessenger` (MEASURED: grep no hits). It only served the Orchids editor's iframe preview.

### (b) `<VisualEditsMessenger />` from `orchids-visual-edits@1.0.13` — `layout.tsx:4,109`

- **What it is (MEASURED from `node_modules/orchids-visual-edits/dist/messenger.mjs`, ~1,450 lines):** a client component for the Orchids visual editor. Registers `window.addEventListener("message", …)` twice (`handleMessage` line 508, `onMsg` line 1133). Handles `ORCHIDS_STYLE_UPDATE`, `ORCHIDS_IMAGE_UPDATE`, `RESIZE_ELEMENT`, and on channel `ORCHIDS_HOVER_v1`: `VISUAL_EDIT_MODE`, `PREVIEW_FONT` (injects `<link>` to `fonts.googleapis.com`), `SCROLL` (`window.scrollBy`). In edit mode it makes elements `contentEditable`, tracks hover/click, and posts hit-test/DOM info to `window.parent` with `"*"`. Persists mode in `localStorage`.
- **Gating:** **no iframe check, no `event.origin` check, no `NODE_ENV` check** — the only filter is `e.data.type === CHANNEL` / message-type string. Any window able to `postMessage` to the page (an embedding parent, an `opener`) can flip it into edit mode.
- **Practical effect today:** the companion Turbopack loader (`orchids-visual-edits/loader`) is **not** configured in `next.config.ts` (MEASURED), so no `data-orchids-id` attributes exist in the DOM and the per-element features no-op. What remains live in production: two global message listeners, a `localStorage` write, and the postMessage-to-parent chatter when framed.
- **What breaks if removed:** nothing — no other import of the package in `src/` (MEASURED). Removing the dependency too would drop `@babel/parser`, `magic-string`, `estree-walker` transitive deps only if nothing else needs them (INFERRED, not checked).

### (c) `<ErrorReporter />` — `src/components/ErrorReporter.tsx`, mounted at `layout.tsx:97`

- **What it captures (MEASURED):** `window` `error` events (message, stack, filename, line, col), `unhandledrejection` (message, stack), and — via a **1 s `setInterval`** — the text of the Next.js dev overlay `[data-nextjs-dialog-overlay]`. On the global-error route it also posts message/stack/digest/name + `navigator.userAgent`.
- **Where it sends it:** `window.parent.postMessage(payload, "*")` — to the embedding page, any origin. **It sends nowhere else** (no fetch, no Sentry, no endpoint). Guarded by `if (!inIframe) return;` so at top level it does nothing at all — i.e. it is **not** production error reporting; nothing is collected when a real user hits an error.
- **Gating:** iframe-only, not env-gated. The global-error UI copy says "Please try again fixing with Orchids" and uses a hard-coded `#6c47ff` button.
- **What breaks if removed:** the layout mount can go with no effect. If a `global-error.tsx` imports it for the fallback UI, that page would need its own component (MEASURED: `src/app/` has no `global-error.tsx`, so currently nothing depends on it). One of the 84 tsc errors lives here (`useRef<NodeJS.Timeout>()`).

### (d) `next.config.ts` `images.remotePatterns` — `hostname: "**"` for `http` and `https`

- **What it allows, plainly:** the Next.js image optimiser (`/_next/image?url=…`) will fetch, decode, re-encode and serve **any URL on the internet, including plain-http**, on this site's origin and Vercel bill. A third party can use `https://skillsnap.com.au/_next/image?url=<their url>&w=3840&q=75` as a free image CDN/proxy, and can point it at large or hostile images to burn compute/egress. It also lets an attacker-controlled `avatar_url` or `media_url` be served from our origin (same-origin image, though not script).
- **Current exposure (MEASURED):** both `next/image` call sites are `unoptimized`, so the app itself never generates `/_next/image` URLs — but the endpoint is still enabled and reachable by anyone who constructs the URL. Restricting to `dnraeyxjzdmpdvrkzyfd.supabase.co` (+ `api.qrserver.com` if the QR is ever moved to `next/image`) would cost nothing today.
- **What breaks if narrowed:** nothing today (both call sites are `unoptimized`); anything that later switches to optimised `next/image` must be on the allow-list.

### (e) Rewrite `/supabase/:path*` → `https://dnraeyxjzdmpdvrkzyfd.supabase.co/:path*`

- **The premise "unused" is wrong — MEASURED.** `src/services/postService.ts:12-18` `proxyMediaUrl()` rewrites every post `media_url` / `thumbnail_url` / `media_items[].url` from `NEXT_PUBLIC_SUPABASE_URL` to `${window.location.origin}/supabase` in the browser (callers at lines 62, 73, 74). Comment says it exists "since the sandbox blocks direct browser requests to external domains" — an Orchids-preview constraint that no longer applies on Vercel.
- **Runtime effect:** all in-app feed/profile post media (images, posters, videos) is streamed **through the Vercel edge** instead of straight from Supabase's CDN → egress billed on both sides, and Supabase's CDN cache-key semantics are lost or diluted. Avatars and the SSR `/[username]` page use direct Supabase URLs, so those are unaffected.
- **What breaks if removed:** every in-app feed image, video, and poster (`HomeFeed`, `ProfileScreen`, `MediaViewer`) 404s until `proxyMediaUrl()` is also removed/neutralised. Remove both together, or neither.
- **Aside (MEASURED):** there is also `src/app/api/proxy/[...path]/route.ts`, a full Supabase proxy that forwards with the anon key and any `Authorization` header. It has **no callers** in `src/` (grep for `api/proxy` outside its own file: none). It grants nothing the anon key doesn't already grant, but it is a live, unreferenced route.

---

## Part 4 — What NOT to port (confirmed no web equivalent)

MEASURED by grep across `src/` (`trim`, `firstFrameRendered`, `first-frame`, `exportedVideo`, `MediaRecorder`, `ffmpeg`, `getUserMedia`, video size logging):

- **Trim guard** — none. The web has no video trimming at all; the only "trim" is a `ProScreen.tsx:12` marketing bullet ("Video Trimmer & Enhancer") and `String.trim()` on captions. `UploadScreen.tsx` accepts a finished MP4/MOV file (≤60 MB) and uploads it as-is.
- **`firstFrameRendered` cover** — none. Web `<video>` elements use a static `poster` (`HomeFeed.tsx:867`, `ProfileScreen.tsx:354`, `WorkGrid.tsx:78`); there is no first-frame readiness state or overlay to swap.
- **Exported-video size logging** — none. Web does not export or re-encode video; the only size touch is the pre-upload `file.size > maxMB` check (`UploadScreen.tsx:49-50`), no logging.

The mobile implementations live in `SkillSnapApp/src/components/TrimStrip.tsx`, `VideoCard.tsx`, `screens/CameraPreviewScreen.tsx` (MEASURED presence only). Nothing on the web corresponds; nobody should try to mirror them.

---

## Summary of what is MEASURED vs INFERRED

- **MEASURED:** absence of any transform in `src/`; every render site, element type, URL source and CSS size; upload ceilings; `proxyMediaUrl` usage; tsc count 84 / 17 files / codes; hand-written 177-line `database.types.ts`; `route-messenger.js` HTTP response and full source; `orchids-visual-edits` handlers and lack of origin/iframe/env gating; `ErrorReporter` sinks; `remotePatterns` config; absence of trim / first-frame / export-size code.
- **INFERRED:** original image dimensions and byte sizes used in the ranking; that regenerating DB types clears ~50–60 tsc errors; that the `slelguoygbfzlpylpxfs` bucket belongs to Orchids; transitive-dep effect of removing `orchids-visual-edits`.

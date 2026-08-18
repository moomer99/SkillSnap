// /get — the single link behind the QR code and the store badges.
// Sends iOS to the App Store, Android to Google Play (once live), everyone
// else to the landing page. Redirect only: no analytics, no UI.
//
// An explicit ?store= wins over user-agent sniffing, so a badge can say what
// it means: ?store=ios goes to the App Store on every platform (Apple's web
// listing is a fine desktop destination); ?store=android goes to Play once
// live and to the landing page until then. A bare /get (the QR code) sniffs.

// LAUNCH DAY (Play production access granted, ~21–27 Aug 2026):
// flip this to `true`. Change nothing else in this file.
const ANDROID_STORE_LIVE = false;

const APP_STORE_URL = "https://apps.apple.com/au/app/id6797864031";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=au.com.skillsnap.app";

// The redirect target changes when Android goes live, so this must never be
// statically optimised or cached as permanent. See Cache-Control below and
// the temporary (307) status — a cached 301 would be unfixable.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const store = url.searchParams.get("store");
  const ua = request.headers.get("user-agent") ?? "";
  const landing = new URL("/", request.url);

  let target: URL;
  if (store === "ios") {
    target = new URL(APP_STORE_URL);
  } else if (store === "android") {
    // Never link the listing while it 404s.
    target = ANDROID_STORE_LIVE ? new URL(PLAY_STORE_URL) : landing;
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    target = new URL(APP_STORE_URL);
  } else if (/Android/i.test(ua) && ANDROID_STORE_LIVE) {
    target = new URL(PLAY_STORE_URL);
  } else {
    // Desktop, bots, Android before Play is live. Also iPadOS 13+, which
    // reports itself as Macintosh — accepted, not a bug to solve here.
    target = landing;
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: target.toString(),
      "Cache-Control": "no-store",
    },
  });
}

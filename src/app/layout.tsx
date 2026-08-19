import type { Metadata, Viewport } from "next"; // v2
import { Geist, Poppins } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headings use Poppins to match the mobile app; body text stays on Geist.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillSnap — Watch. Trust. Connect. | Find Skilled Pros in Western Sydney",
  description: "SkillSnap lets barbers, tradies and cleaners in Western Sydney show real work on video. Watch. Trust. Connect. Free to join.",
  icons: {
    // SVG first — it stays crisp at every size and modern browsers prefer it —
    // then the .ico fallback, then raster sizes for everything else.
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SkillSnap — Watch. Trust. Connect. | Find Skilled Pros in Western Sydney",
    description: "SkillSnap lets barbers, tradies and cleaners in Western Sydney show real work on video. Watch. Trust. Connect. Free to join.",
    url: "https://skillsnap.com.au",
    siteName: "SkillSnap",
    images: [
      {
        url: "https://skillsnap.com.au/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillSnap — Watch. Trust. Connect. | Find Skilled Pros in Western Sydney",
    description: "SkillSnap lets barbers, tradies and cleaners in Western Sydney show real work on video. Watch. Trust. Connect. Free to join.",
    images: ["https://skillsnap.com.au/og-image.png"],
  },
  verification: {
    google: "BD_TD-VwqfAkBX15m3yxppU4UXGHRXNa7uxXlk6odTA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale / userScalable: false — blocking pinch-zoom fails WCAG 1.4.4
  // and also disables zoom in desktop browsers.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint. Inline and synchronous
            on purpose: deferring it to React would flash the default theme.
            The storage key matches THEME_STORAGE_KEY in hooks/useTheme.ts. */}
        {/* Dark-only for launch (LIGHT_THEME_ENABLED = false in hooks/useTheme.ts):
            applies 'dark' unconditionally and leaves the stored preference in
            place. To restore light mode, swap back to the original line kept
            below and flip the flag.
            Original:
            __html: `(function(){try{var t=localStorage.getItem('skillsnap-theme');var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(t==='light'?'light':'dark');}catch(e){}})();` */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.remove('light');r.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${poppins.variable} antialiased`}
      >
        {children}
        <Script id="sw-unregister" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
          }
        `}</Script>
        <Analytics />
        {process.env.NODE_ENV === "production" && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />
        )}
      </body>
    </html>
  );
}

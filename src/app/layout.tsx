import type { Metadata, Viewport } from "next"; // v2
import { Geist } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillSnap — Watch. Trust. Connect. | Find Skilled Pros in Western Sydney",
  description: "SkillSnap lets barbers, tradies and cleaners in Western Sydney show real work on video. Watch. Trust. Connect. Free to join.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SkillSnap" />
        <meta name="theme-color" content="#6c47ff" />
        <link rel="apple-touch-icon" href="/skillsnap-icon.svg" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />

      </head>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
        <Analytics />
        {process.env.NODE_ENV === "production" && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />
        )}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { Analytics } from "@vercel/analytics/next";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillSnap — Watch. Trust. Connect.",
  description: "Discover skilled professionals through real video proof. No more guessing — watch the work.",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  openGraph: {
    title: "SkillSnap — Watch. Trust. Connect.",
    description: "Discover skilled professionals through real video proof. No more guessing — watch the work.",
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
    title: "SkillSnap — Watch. Trust. Connect.",
    description: "Discover skilled professionals through real video proof. No more guessing — watch the work.",
    images: ["https://skillsnap.com.au/og-image.png"],
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
        <Script id="sw-unregister" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
          }
        `}</Script>
        <Analytics />
      </body>
    </html>
  );
}

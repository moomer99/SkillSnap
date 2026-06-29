import type { Metadata } from "next";
import DiscoverClientPage from "./client";

export const metadata: Metadata = {
  title: "Discover Local Skilled Pros | SkillSnap",
  description:
    "Browse barbers, tradies and cleaners near you in Western Sydney. Watch real work videos before you connect.",
  openGraph: {
    title: "Discover Local Skilled Pros | SkillSnap",
    description:
      "Browse barbers, tradies and cleaners near you in Western Sydney. Watch real work videos before you connect.",
    url: "https://skillsnap.com.au/discover",
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
};

export default function DiscoverPage() {
  return <DiscoverClientPage />;
}
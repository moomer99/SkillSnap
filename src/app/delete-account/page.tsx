import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, {
  Bullets,
  Callout,
  Section,
  SUPPORT_EMAIL,
} from "@/components/legal/LegalPage";

// ─────────────────────────────────────────────
// Google Play requires a publicly reachable account deletion page, separate
// from the in-app flow, that a user can find without installing the app. This
// is that page: it documents the in-app route and gives an email path for
// anyone locked out of their account.
//
// Deliberately not a form. A form that accepts a typed username would let
// anyone request deletion of an account they do not own; requiring the request
// to come from the account's own email address is the check that makes this
// safe without building an authenticated web flow.
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Delete Your Account | SkillSnap",
  description:
    "How to permanently delete your SkillSnap account and all associated data, in the app or by request.",
  alternates: { canonical: "https://skillsnap.com.au/delete-account" },
  openGraph: {
    title: "Delete Your Account | SkillSnap",
    description:
      "How to permanently delete your SkillSnap account and all associated data, in the app or by request.",
    url: "https://skillsnap.com.au/delete-account",
    siteName: "SkillSnap",
    locale: "en_AU",
    type: "website",
  },
};

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Delete your account"
      lastUpdated="12 August 2026"
      intro="You can delete your SkillSnap account and everything in it at any time. There are two ways to do it, and both are permanent."
    >
      <Section title="Option 1 — In the app (fastest)">
        <p>This takes about ten seconds and happens immediately.</p>
        <Bullets
          items={[
            "Open SkillSnap and go to your Profile tab.",
            "Tap the menu button in the top right, then Settings.",
            "Scroll to the bottom and tap Delete Account.",
            "Read what will be removed, type the word DELETE to confirm, then tap Delete my account.",
          ]}
        />
        <p>
          Your account and data are deleted at that moment. You will be signed out and
          returned to the sign-in screen.
        </p>
      </Section>

      <Section title="Option 2 — By email">
        <p>
          If you cannot sign in, have lost access to your device, or would rather we did it
          for you, email us:
        </p>
        <Callout>
          <p className="font-bold text-[15px]">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="mt-1.5">
            Send it <strong>from the email address on the account</strong> and put
            &ldquo;Account deletion request&rdquo; in the subject line. Include your
            username if you know it.
          </p>
        </Callout>
        <p>
          We need the request to come from the account&rsquo;s own email address so we can
          confirm it is really you. We cannot delete an account on the word of someone who
          cannot prove they own it.
        </p>
        <p>
          We will action the request and confirm by reply. Please allow a few business days.
        </p>
      </Section>

      <Section title="What gets deleted">
        <p>Deleting your account removes:</p>
        <Bullets
          items={[
            "Your profile — display name, username, photo, bio, skill, availability and location.",
            "All your posts, and the videos and photos attached to them.",
            "Your messages and conversations.",
            "Your follows and followers, likes, and saved posts.",
            "Your Jobs Done records.",
            "Accounts you have blocked, and reports you have made.",
            "Your notification settings and the push token for your device.",
            "Your sign-in, so the email address can be used to register again later.",
          ]}
        />
        <p>
          Because every conversation on SkillSnap is between two people, deleting your
          account deletes those conversations for the other person too. Your messages will
          no longer be visible to them.
        </p>
      </Section>

      <Section title="What this does not cover">
        <p>
          Anything already saved, screenshotted or re-shared by other people outside
          SkillSnap is beyond our reach. Profiles and posts are public while they exist, so
          treat them that way.
        </p>
        <p>
          Our service providers may hold their own backups or server logs for their own
          periods, which we do not control.
        </p>
        <p>
          Where the law requires us to keep a record — for example a report of unlawful content —
          we keep only that record, and only for as long as the law requires.
        </p>
      </Section>

      <Section title="This cannot be undone">
        <p>
          There is no grace period, no archive and no backup we can restore from. Once the
          deletion runs, your work is gone. If you only want a break, you can delete
          individual posts, or clear your location so you stop appearing on the map, and
          leave the account in place.
        </p>
        <p>
          If you are deleting because something went wrong, tell us first at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[color:var(--ss-purple)] font-semibold">
            {SUPPORT_EMAIL}
          </a>
          . We would rather fix it.
        </p>
      </Section>

      <Section title="More detail">
        <p>
          Our{" "}
          <Link href="/privacy" className="text-[color:var(--ss-purple)] font-semibold">
            Privacy Policy
          </Link>{" "}
          explains what we collect, who can see it and how long we keep it. The{" "}
          <Link href="/help" className="text-[color:var(--ss-purple)] font-semibold">
            Help page
          </Link>{" "}
          covers the rest of the app.
        </p>
      </Section>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, {
  Bullets,
  Callout,
  Section,
  SubSection,
  SUPPORT_EMAIL,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Help & Support | SkillSnap",
  description:
    "How SkillSnap works: posting your work, connecting with people, what Jobs Done means, reporting and blocking, and deleting your account.",
  alternates: { canonical: "https://skillsnap.com.au/help" },
  openGraph: {
    title: "Help & Support | SkillSnap",
    description:
      "How SkillSnap works: posting your work, connecting with people, what Jobs Done means, reporting and blocking, and deleting your account.",
    url: "https://skillsnap.com.au/help",
    siteName: "SkillSnap",
    locale: "en_AU",
    type: "website",
  },
};

export default function HelpPage() {
  return (
    <LegalPage
      title="Help & Support"
      lastUpdated="1 August 2026"
      intro="How SkillSnap works, and how to do the things people ask about most. If you cannot find what you need here, email us — a real person reads it."
    >
      <Section title="What SkillSnap is">
        <p>
          SkillSnap is where skilled people show their work on video instead of asking you to read
          reviews. Barbers, tradies, cleaners, photographers, tutors and everyone in between post
          short videos of jobs they have actually done. You watch the work, then message them
          directly.
        </p>
        <p>
          It is free for everyone, and there are no booking fees. SkillSnap introduces people; any
          job you agree is directly between you and the other person.
        </p>
      </Section>

      <Section title="Getting around the app">
        <SubSection title="Feed">
          <p>
            Videos and photos from people on SkillSnap. Switch to the Following tab to see only
            people you follow. Tap a post to open it, or tap the poster to see their full profile.
          </p>
        </SubSection>

        <SubSection title="Discover">
          <p>
            A map of people near you, plus search. Search matches names, skills and locations, so
            you can type &ldquo;plumber&rdquo;, a suburb, or someone&rsquo;s name. Tap a pin to see
            who is there.
          </p>
        </SubSection>

        <SubSection title="Post">
          <p>
            The + button. Record something new or pick a video or photo from your library, add a
            caption and a location, and post it. You can put several files in one post and choose
            which one is the cover.
          </p>
        </SubSection>

        <SubSection title="Messages">
          <p>Your conversations. Unread threads show a badge on the tab.</p>
        </SubSection>

        <SubSection title="Profile">
          <p>
            Your work, your stats and your settings. The Profile Strength card tells you what is
            still missing — a photo, a bio, a skill, a location, a first post.
          </p>
        </SubSection>
      </Section>

      <Section title="How Connect works">
        <p>
          Connect is the button on someone&rsquo;s profile or feed card. Tapping it opens a direct
          message thread with that person, so you can ask about a job, get a quote, or sort out a
          time. If you have messaged before, it reopens the thread you already have rather than
          starting a new one.
        </p>
        <p>
          They get a notification, if they have notifications switched on. There is no request to
          accept and no waiting — the conversation is open straight away.
        </p>
        <p>
          Connect will not work if either of you has blocked the other. That is deliberate, and
          neither person is told which side the block came from.
        </p>
      </Section>

      <Section title="What Jobs Done means">
        <p>
          Jobs Done is the number on a profile that counts completed jobs. It is not a rating and
          it is not self-reported.
        </p>
        <p>
          A job only counts when <strong>both people confirm it in the chat</strong> — the person
          who did the work and the person they did it for. Until both have confirmed, nothing is
          added. That is what stops anyone inflating their own number.
        </p>
        <Callout>
          A high Jobs Done number means someone has completed work that other users confirmed. It
          does not mean the work was good, and it is not a licence check. Always ask for licence
          and insurance details before hiring for licensed work.
        </Callout>
      </Section>

      <Section title="Following, and what is public">
        <p>
          Following someone puts their posts in your Following feed. Follows are public, and
          follower counts are shown on profiles.
        </p>
        <p>
          Your profile, your posts, your skill, your suburb and your map pin are public. Anyone can
          see them, including people who are not signed in. Your messages, your saved posts and
          your blocked list are not public. There is more detail in the{" "}
          <Link href="/privacy" className="text-[#6c47ff] font-semibold">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Setting your location">
        <p>
          You can use your device&rsquo;s location or type a suburb. Your location puts you on the
          Discover map and helps people nearby find you.
        </p>
        <p>
          The pin sits at the coordinates saved on your profile, and it is public. Set it to your
          suburb or the area you work in rather than your home address. You can change or clear it
          any time in Edit Profile.
        </p>
      </Section>

      <Section title="Reporting someone">
        <p>
          On a profile, tap the ••• button in the top corner and choose Report User. On a post, open
          the post&rsquo;s menu and choose Report.
        </p>
        <p>
          You will be asked to pick a reason: spam, harassment or bullying, nudity or sexual
          content, violence or dangerous acts, false information, or something else. The report
          comes to us for review. The person you reported is not told who reported them.
        </p>
        <p>
          If someone is in danger, contact the police on 000 first. We are not an emergency service.
        </p>
      </Section>

      <Section title="Blocking someone">
        <p>On a profile, tap the ••• button and choose Block User. When you block someone:</p>
        <Bullets
          items={[
            "You both stop following each other.",
            "Neither of you can start a conversation with the other.",
            "Their posts stop appearing for you, and yours stop appearing for them.",
            "They are not told that you blocked them.",
          ]}
        />
        <p>
          To undo it, go to Settings, then Blocked Accounts, and tap Unblock. You can also unblock
          from their profile. Unblocking does not restore the follows that the block removed.
        </p>
      </Section>

      <Section title="Notifications">
        <p>
          Settings, then Notifications, lets you turn off new messages, new followers, Jobs Done
          requests and connection requests separately, plus the emails we send. Switching a
          category off stops us sending it.
        </p>
        <p>
          If you are not getting notifications at all, check that you allowed them for SkillSnap in
          your phone&rsquo;s own settings — we cannot send anything if permission was declined
          there.
        </p>
      </Section>

      <Section title="Deleting a post">
        <p>
          Press and hold a post in your profile grid, or open its menu, and choose Delete. That
          removes the post, its video or photos, and its likes. It cannot be undone.
        </p>
        <p>You can edit a post&rsquo;s caption, skill and location without deleting it.</p>
      </Section>

      <Section title="Deleting your account">
        <p>
          Open your profile, tap the menu in the top corner, then Settings, then Delete Account at
          the bottom.
        </p>
        <p>
          You will be asked to type the word DELETE to confirm. This is permanent. It removes your
          profile, all your posts and their videos and photos, your messages and conversations,
          your follows, likes and saved posts, your Jobs Done records, and your sign-in. There is
          no backup and we cannot bring it back.
        </p>
        <p>
          Deleting a conversation deletes it for the other person too, so your messages will no
          longer be visible to them.
        </p>
        <p>
          If you cannot get into your account, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>{" "}
          from the address on the account and we will do it for you.
        </p>
        <p>
          If something has gone wrong and you are deleting because of it, tell us first — we would
          rather fix it.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>
          . Tell us your username and what happened, and include a screenshot if you have one. We
          usually reply within a couple of days.
        </p>
        <p>SkillSnap · Sydney, New South Wales, Australia</p>
      </Section>
    </LegalPage>
  );
}

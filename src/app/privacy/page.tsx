import type { Metadata } from "next";
import LegalPage, {
  Bullets,
  Callout,
  Section,
  SubSection,
  SUPPORT_EMAIL,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | SkillSnap",
  description:
    "How SkillSnap collects, uses, stores and shares your personal information, and how to access or delete it.",
  alternates: { canonical: "https://skillsnap.com.au/privacy" },
  openGraph: {
    title: "Privacy Policy | SkillSnap",
    description:
      "How SkillSnap collects, uses, stores and shares your personal information, and how to access or delete it.",
    url: "https://skillsnap.com.au/privacy",
    siteName: "SkillSnap",
    locale: "en_AU",
    type: "website",
  },
};

/** Who can see what. Kept as a table because the distinction is the whole point. */
const VISIBILITY: { item: string; who: string }[] = [
  { item: "Display name, username, profile photo, bio", who: "Anyone, including people who are not signed in" },
  { item: "Your skill or trade, availability, suburb", who: "Anyone, including people who are not signed in" },
  { item: "Map location (coordinates), if you set one", who: "Anyone, including people who are not signed in" },
  { item: "Posts, videos, photos and captions", who: "Anyone, including people who are not signed in" },
  { item: "Follower and following counts, jobs done, likes", who: "Anyone, including people who are not signed in" },
  { item: "Direct messages", who: "You and the person you are messaging" },
  { item: "Jobs Done records", who: "You and the other person in that job" },
  { item: "Saved posts", who: "You only" },
  { item: "Email address", who: "You and SkillSnap. Not shown to other users" },
  { item: "Notification settings and device push token", who: "You and SkillSnap. Not shown to other users" },
  { item: "People you have blocked", who: "You only" },
];

const PROCESSORS: { name: string; what: string }[] = [
  {
    name: "Supabase",
    what: "Runs our database, sign-in system, file storage and server functions. Almost everything described in this policy is stored with Supabase.",
  },
  {
    name: "Vercel",
    what: "Hosts skillsnap.com.au and provides basic website traffic analytics.",
  },
  {
    name: "Google",
    what: "Google Analytics on the website; Google sign-in if you use it; and Google Maps, which renders the map in the mobile app.",
  },
  {
    name: "Apple",
    what: "Sign in with Apple, if you use it, and delivery of push notifications to iPhones and iPads.",
  },
  {
    name: "Expo",
    what: "Sends our push notifications to Apple and Google for delivery to your device.",
  },
  {
    name: "Resend",
    what: "Sends notification emails, such as an alert that you have a new message or follower.",
  },
  {
    name: "OpenStreetMap (Nominatim)",
    what: "Turns a suburb you type, or your device's coordinates, into a place name. Used on the website when you set your location.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="1 August 2026"
      intro="This policy explains what SkillSnap collects, why, who can see it, and how to get it back or delete it. It covers both the SkillSnap mobile app and the skillsnap.com.au website. We have tried to describe exactly what the product actually does, in plain language."
    >
      <Section title="The short version">
        <Bullets
          items={[
            "Your profile and your posts are public. Anyone can see them, including people who have not signed in and search engines.",
            "If you set a location, it is shown as a pin on the public map in the app. Only set a location you are comfortable making public.",
            "Your direct messages are private between you and the other person.",
            "Your email address is never shown to other users.",
            "We do not sell your personal information.",
            "You can delete your account and its data from Settings in the app at any time.",
          ]}
        />
      </Section>

      <Section title="Who we are">
        <p>
          SkillSnap is an Australian platform that lets skilled people show their work on video
          and connect with local clients. In this policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and
          &ldquo;SkillSnap&rdquo; mean the operator of the SkillSnap app and website, based in
          Sydney, New South Wales.
        </p>
        <p>
          We handle personal information in line with the Australian Privacy Principles in the
          Privacy Act 1988 (Cth). If you want to raise anything with us, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="What we collect">
        <SubSection title="Account details">
          <p>
            When you sign up we collect your email address and a password, or, if you use Google
            or Apple sign-in, the account identifier, name and profile picture those services give
            us. Passwords are handled by our sign-in provider, Supabase. We never see them.
          </p>
          <p>
            We create a username and display name for you from your name or email address at
            sign-up. You can change both later.
          </p>
        </SubSection>

        <SubSection title="Your profile">
          <p>
            Whatever you add to your profile: display name, username, profile photo, bio, your
            skill or trade, your availability, and the suburb or location you set. This is a public
            profile and it is meant to be seen.
          </p>
        </SubSection>

        <SubSection title="Location">
          <p>There are two ways your location gets set, and both are things you start:</p>
          <Bullets
            items={[
              "You tap to use your device's location. The app asks your permission first. On the website, your browser asks.",
              "You type a suburb.",
            ]}
          />
          <p>
            Either way we store a place name and, in most cases, a pair of map coordinates on your
            profile. On the website, we send what you typed or your device coordinates to
            OpenStreetMap&rsquo;s Nominatim service to turn it into a place name.
          </p>
          <p>
            Your coordinates are used to place a pin for you on the Discover map in the app and to
            work out who is near a person searching. Your profile is public, so that pin is public
            too.
          </p>
          <Callout>
            <strong>Please read this bit.</strong> The map pin is placed at the exact coordinates
            saved on your profile. If you set your location while standing at home, the pin is your
            home. Set your location to your suburb, or to where you actually work, rather than your
            front door. We do not track your location in the background at any time.
          </Callout>
        </SubSection>

        <SubSection title="Camera, microphone and photos">
          <p>
            The app asks for permission to use your camera, microphone and photo library so you can
            record or choose a video or photo to post, and pick a profile picture. We only use them
            at the moment you are creating something. Nothing is recorded in the background, and we
            do not read your photo library beyond the files you pick.
          </p>
          <p>
            Files you upload are stored in our file storage and served from public web addresses.
            Anyone who has the link to a file can open it without signing in.
          </p>
        </SubSection>

        <SubSection title="Messages">
          <p>
            The text of messages you send through SkillSnap is stored so the conversation works
            across your devices. Our access rules limit reading a conversation to the two people in
            it. As the operator of the database, we can technically access message content, and we
            may do so where we need to investigate a report of abuse or where the law requires it.
            We do not read messages for advertising and we do not sell them.
          </p>
        </SubSection>

        <SubSection title="What you do on SkillSnap">
          <p>
            Who you follow, who follows you, posts you like, posts you save, jobs recorded as done,
            reports you make, and accounts you block. Follows, likes and jobs-done counts are
            public. Saved posts, reports and your blocked list are not shown to other users.
          </p>
        </SubSection>

        <SubSection title="Notifications">
          <p>
            If you allow push notifications, your device gives us a push token, which we store on
            your profile so we can send you alerts. We also store your notification preferences so
            we only send the kinds you have left switched on. Turning a category off in Settings
            stops those notifications being sent.
          </p>
        </SubSection>

        <SubSection title="Website analytics">
          <p>
            The website uses Google Analytics and Vercel Analytics. These record things like which
            pages were viewed, which site you arrived from, your rough location based on your IP
            address, and your device and browser type. We have not set up any custom tracking of
            individual actions. The mobile app does not include either analytics tool.
          </p>
        </SubSection>
      </Section>

      <Section title="Who can see what">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4 font-bold text-[#1a1a1a] border-b border-[#e8e4df] align-bottom">
                  Information
                </th>
                <th className="py-2 font-bold text-[#1a1a1a] border-b border-[#e8e4df] align-bottom">
                  Who can see it
                </th>
              </tr>
            </thead>
            <tbody>
              {VISIBILITY.map((row) => (
                <tr key={row.item}>
                  <td className="py-2.5 pr-4 border-b border-[#f0eeea] align-top">{row.item}</td>
                  <td className="py-2.5 border-b border-[#f0eeea] align-top text-[#57534e]">
                    {row.who}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pt-1">
          Because profiles and posts are readable without signing in, they can also be found by
          search engines and copied by anyone who sees them. Treat anything you put on your profile
          or in a post as public and permanent, even though you can delete it from SkillSnap.
        </p>
      </Section>

      <Section title="Why we use your information">
        <Bullets
          items={[
            "To create and run your account.",
            "To show your profile and posts to other people, which is the point of the service.",
            "To show nearby people on the map and in search results.",
            "To deliver your messages.",
            "To send notifications you have asked for, by push or email.",
            "To deal with reports, blocks and misuse of the platform.",
            "To understand, in aggregate, how the website is being used.",
          ]}
        />
        <p>
          We do not sell your personal information, and we do not use it for advertising or
          profiling.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          We do not share your personal information with anyone except the service providers we use
          to run SkillSnap, and only so they can do the job we use them for:
        </p>
        <div className="space-y-3 pt-1">
          {PROCESSORS.map((p) => (
            <div key={p.name}>
              <p className="font-semibold text-[#1a1a1a] text-[15px]">{p.name}</p>
              <p>{p.what}</p>
            </div>
          ))}
        </div>
        <p>
          These providers are overseas companies, so your information is likely to be stored or
          processed outside Australia, including in the United States. Each has its own privacy
          policy governing how it handles data on our behalf.
        </p>
        <p>
          We may also disclose information where we are required to by law, or where it is
          necessary to investigate a report of harm or abuse.
        </p>
      </Section>

      <Section title="How your information is stored">
        <p>
          Your information is held in a hosted database and file storage run by Supabase. Access
          rules on the database control which account can read which records, which is what keeps
          your messages, saved posts and blocked list from being visible to other users. Uploaded
          photos and videos are held in public file storage, so anyone with a file&rsquo;s direct
          link can view it.
        </p>
        <p>
          No online service can promise perfect security, and we are not going to. If we become
          aware of a data breach that is likely to cause you serious harm, we will notify you and
          the Office of the Australian Information Commissioner as the Privacy Act requires.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information for as long as your account exists. You can delete individual
          posts at any time, which removes the post and its media.
        </p>
        <p>
          When you delete your account, we delete your profile, posts, uploaded photos and videos,
          messages and conversations, follows, likes, saved posts, jobs-done records, blocks,
          reports and your sign-in. This happens at the time you confirm the deletion, not on a
          schedule.
        </p>
        <p>
          Two things to be aware of. Our providers may keep backups or server logs for their own
          periods, which we do not control. And where the law requires us to retain something, we
          will keep only what we must.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>In the app: open your profile, tap the menu, then Settings, then Delete Account.</p>
        <p>
          You will be asked to type the word DELETE to confirm, because it cannot be undone and
          there is no backup we can restore for you.
        </p>
        <p>
          If you cannot get into your account, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>{" "}
          from the address on the account and we will delete it for you.
        </p>
        <p>
          Deleting a conversation deletes it for both people in it. Your messages will no longer be
          visible to the person you were talking to.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the Australian Privacy Principles you can:</p>
        <Bullets
          items={[
            "Ask what personal information we hold about you and get a copy of it.",
            "Ask us to correct anything that is wrong. Most of it you can edit yourself in the app.",
            "Ask us to delete your information, which you can do yourself with Delete Account.",
            "Ask us not to send you notifications, which you can also do yourself in Settings.",
            "Complain if you think we have mishandled your information.",
          ]}
        />
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>{" "}
          for any of these. We will respond within 30 days. There is no charge for asking for a
          copy of your information.
        </p>
        <p>
          If you are not happy with how we handle your complaint, you can take it to the Office of
          the Australian Information Commissioner at{" "}
          <a
            href="https://www.oaic.gov.au"
            className="text-[#6c47ff] font-semibold"
            rel="noopener noreferrer"
            target="_blank"
          >
            oaic.gov.au
          </a>
          .
        </p>
      </Section>

      <Section title="Children">
        <p>
          SkillSnap is for people aged 18 and over. We do not knowingly collect information from
          anyone under 18. If you believe a child has an account, email us and we will remove it.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change how we handle your information, we will update this page and change the date
          at the top. If the change is significant, we will tell you in the app or by email before
          it takes effect.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p>SkillSnap · Sydney, New South Wales, Australia</p>
      </Section>
    </LegalPage>
  );
}

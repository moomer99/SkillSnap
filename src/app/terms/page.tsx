import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, {
  Bullets,
  Callout,
  Section,
  SUPPORT_EMAIL,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | SkillSnap",
  description:
    "The rules for using SkillSnap: acceptable use, your content, what SkillSnap is and is not responsible for, and how accounts can be terminated.",
  alternates: { canonical: "https://skillsnap.com.au/terms" },
  openGraph: {
    title: "Terms of Service | SkillSnap",
    description:
      "The rules for using SkillSnap: acceptable use, your content, what SkillSnap is and is not responsible for, and how accounts can be terminated.",
    url: "https://skillsnap.com.au/terms",
    siteName: "SkillSnap",
    locale: "en_AU",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="1 August 2026"
      intro="These are the rules for using SkillSnap. By creating an account or using the app or website, you agree to them. If you do not agree, please do not use SkillSnap."
    >
      <Section title="1. About SkillSnap">
        <p>
          SkillSnap is an Australian platform where skilled people show their work on video and
          local clients can find them. We operate the app and the website at skillsnap.com.au.
        </p>
        <p>
          SkillSnap is for people aged 18 and over. By using it, you confirm you are at least 18.
        </p>
        <p>
          SkillSnap is free to use. If we introduce paid features in future, we will publish their
          terms and pricing before you can buy anything.
        </p>
      </Section>

      <Section title="2. Your account">
        <p>
          You are responsible for what happens on your account, including keeping your password to
          yourself. Give us accurate information when you sign up, and keep it accurate.
        </p>
        <p>
          One person, one account. Do not impersonate someone else, and do not claim skills,
          licences or qualifications you do not have.
        </p>
      </Section>

      <Section title="3. Acceptable use">
        <p>Do not use SkillSnap to:</p>
        <Bullets
          items={[
            "Harass, bully, threaten, stalk or abuse anyone.",
            "Post content that is hateful, violent, sexually explicit, or that promotes harm to people or animals.",
            "Post anything illegal, or use SkillSnap to arrange anything illegal.",
            "Post false or misleading claims about your work, your qualifications, or anyone else.",
            "Post someone else's photos, videos or work as your own, or infringe anyone's intellectual property.",
            "Share someone else's personal information without their permission.",
            "Send spam or unsolicited advertising, including in direct messages.",
            "Scrape, copy or bulk-collect data from the platform, or try to break, overload or reverse-engineer it.",
            "Create accounts by automated means, or get around a block, suspension or removal.",
          ]}
        />
        <p>
          If you see something that breaks these rules, report it. Every post and profile has a
          report option, and you can block any account. See the{" "}
          <Link href="/help" className="text-[#6c47ff] font-semibold">
            Help page
          </Link>{" "}
          for how.
        </p>
      </Section>

      <Section title="4. Your content">
        <p>
          You own what you post. Your photos, videos, captions and profile text remain yours, and
          nothing here transfers ownership to us.
        </p>
        <p>
          To be able to run the service, you give us a non-exclusive, worldwide, royalty-free
          licence to host, store, reproduce, resize and display your content within SkillSnap and
          for promoting SkillSnap itself. This licence exists so we can show your post in the feed,
          on your profile, on the map and in search results. It ends when you delete the content or
          your account, except for copies that other people have already saved or shared outside
          the platform, which we cannot reach.
        </p>
        <p>
          You are responsible for what you post. Only post content you have the right to post, and
          make sure anyone identifiable in your videos or photos is happy to be there.
        </p>
        <p>
          Uploaded files are served from public web addresses, and profiles and posts can be viewed
          by anyone, including people who are not signed in. Do not post anything you are not
          comfortable making public.
        </p>
        <p>
          We may remove content that breaks these terms, or that we are legally required to remove.
        </p>
      </Section>

      <Section title="5. SkillSnap is not a party to your work agreement">
        <Callout>
          SkillSnap introduces people. It is not an employer, an agency, a contractor, or a party
          to any agreement you make with someone you meet here.
        </Callout>
        <p>
          Any job, quote, price, schedule or payment is agreed directly between you and the other
          person. We are not involved in it. We do not process payments between users, we do not
          hold funds, and we do not guarantee that anyone will pay you or show up.
        </p>
        <p>
          If a job goes wrong, that is a matter between you and the other person. You can report an
          account to us and we will look at whether they should stay on the platform, but we cannot
          arbitrate your dispute, recover your money, or make anyone finish a job.
        </p>
      </Section>

      <Section title="6. No warranty on other users or their work">
        <p>
          We do not verify the qualifications, licences, insurance, police checks, identity or work
          quality of anyone on SkillSnap. A profile on SkillSnap is not a recommendation or an
          endorsement from us.
        </p>
        <p>
          &ldquo;Jobs Done&rdquo; counts jobs that two users have each confirmed in a conversation
          on the platform. It is a signal, not a guarantee, and it is not evidence that any
          particular job was done well.
        </p>
        <p>
          Do your own checks before you hire anyone or take on work: ask for licence numbers, check
          them with the relevant authority, ask for insurance details, and get a written quote. In
          New South Wales, trades such as electrical, plumbing and building work require a licence,
          and it is worth confirming one exists.
        </p>
      </Section>

      <Section title="7. The service itself">
        <p>
          SkillSnap is provided &ldquo;as is&rdquo;. We will make reasonable efforts to keep it
          running, but we do not promise it will always be available, error-free, or that anything
          you post will stay available forever.
        </p>
        <p>
          We may change, suspend or discontinue features at any time. If we plan to shut down the
          service, we will give reasonable notice so you can retrieve your content.
        </p>
      </Section>

      <Section title="8. Liability">
        <p>
          Nothing in these terms excludes, restricts or modifies any right you have under the
          Australian Consumer Law or any other law that cannot be excluded by agreement. Where a
          consumer guarantee applies and can be limited, our liability is limited to resupplying
          the service or paying the cost of having it resupplied.
        </p>
        <p>
          Beyond that, and to the extent the law allows, we are not liable for indirect or
          consequential loss, loss of profit, loss of data, or loss arising from your dealings with
          another user, including any work performed or not performed, any payment made or not
          made, and any injury, damage or loss connected to a job arranged through SkillSnap.
        </p>
        <p>
          You agree to be responsible for loss we suffer because you broke these terms or used
          SkillSnap unlawfully.
        </p>
      </Section>

      <Section title="9. Suspension and termination">
        <p>
          You can stop using SkillSnap at any time and delete your account from Settings. Deleting
          your account removes your profile, posts, media and messages, and cannot be undone.
        </p>
        <p>
          We can suspend or remove an account that breaks these terms. For serious breaches such as
          harassment, illegal content, fraud or impersonation, we may do that immediately and
          without notice. Where it is reasonable to, we will tell you why and give you a chance to
          respond.
        </p>
        <p>
          If your account is removed, you can ask us to reconsider by emailing{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="10. Privacy">
        <p>
          Our{" "}
          <Link href="/privacy" className="text-[#6c47ff] font-semibold">
            Privacy Policy
          </Link>{" "}
          explains what we collect and who can see it. It forms part of these terms. The short
          version: your profile and posts are public, your messages are not, and you can delete
          everything from Settings.
        </p>
      </Section>

      <Section title="11. Changes to these terms">
        <p>
          We may update these terms. We will change the date at the top, and if the change is
          significant we will tell you in the app or by email before it takes effect. Continuing to
          use SkillSnap after that means you accept the new terms.
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These terms are governed by the laws of New South Wales, Australia. You and SkillSnap
          submit to the non-exclusive jurisdiction of the courts of New South Wales and the courts
          able to hear appeals from them.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Questions about these terms? Email{" "}
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

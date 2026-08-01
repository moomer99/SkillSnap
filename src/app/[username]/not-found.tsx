import Link from "next/link";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";

/**
 * Shown for a handle that does not resolve, and for any path that reaches this
 * route without a valid @handle. Returns a real 404 status.
 */
export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col items-center justify-center px-6 text-center">
      <Link href="/" aria-label="SkillSnap home" className="mb-8">
        <SkillSnapLogo variant="full" size="sm" />
      </Link>

      <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-2">
        This profile doesn&rsquo;t exist
      </h1>
      <p className="text-[15px] text-[#7a7570] leading-relaxed max-w-[340px]">
        The link or QR code may be out of date, the username may have changed, or the
        account may have been deleted.
      </p>

      <Link
        href="/"
        className="inline-flex items-center justify-center h-12 px-7 rounded-2xl font-extrabold text-[15px] text-white mt-7"
        style={{
          background: "linear-gradient(135deg,#6c47ff,#8b6af5)",
          boxShadow: "0 4px 20px rgba(108,71,255,0.35)",
        }}
      >
        Find local pros →
      </Link>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-12">
        <Link href="/privacy" className="text-[13px] font-semibold text-[#6c47ff]">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-[13px] font-semibold text-[#6c47ff]">
          Terms of Service
        </Link>
        <Link href="/help" className="text-[13px] font-semibold text-[#6c47ff]">
          Help
        </Link>
      </div>
    </div>
  );
}

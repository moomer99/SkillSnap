"use client";
// ─────────────────────────────────────────────
// SkillSnap — Empty & Loading States
// ─────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-[#1a1a1a] mb-1">{title}</p>
      {subtitle && <p className="text-sm text-[#7a7570] leading-relaxed">{subtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-6 h-10 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
      <p className="text-xs text-[#7a7570] font-medium">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full aspect-[9/16] max-h-[85vh] bg-[#e8e4df] mb-2 animate-pulse" />
  );
}

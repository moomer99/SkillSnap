"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, Info, X } from "lucide-react";

type ToastType = "info" | "success" | "coming-soon";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  comingSoon: (feature?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  const comingSoon = useCallback((feature?: string) => {
    showToast(
      feature ? `${feature} is coming soon!` : "This feature is coming soon!",
      "coming-soon"
    );
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, comingSoon }}>
      {children}
      {/* Toast stack — bottom of screen, above nav */}
      <div className="fixed bottom-24 left-0 right-0 z-[999] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-sm w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              background:
                t.type === "coming-soon"
                  ? "linear-gradient(135deg, #6c47ff, #8b6af5)"
                  : t.type === "success"
                  ? "#16a34a"
                  : "#1a1a1a",
            }}
          >
            <span className="flex-shrink-0 text-white">
              {t.type === "success" ? (
                <CheckCircle size={18} />
              ) : t.type === "coming-soon" ? (
                <span className="text-base">🚀</span>
              ) : (
                <Info size={18} />
              )}
            </span>
            <p className="text-white text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

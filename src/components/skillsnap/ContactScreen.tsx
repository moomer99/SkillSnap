"use client";
import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { Screen } from "@/types";
import { SUPPORT_EMAIL } from "@/constants/contact";

interface ContactScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function ContactScreen({ onNavigate }: ContactScreenProps) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch("https://formspree.io/f/mjglodwj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (response.ok) {
        setDone(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("settings")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Contact Us</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6">
        {done ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="font-bold text-[#1a1a1a] text-lg mb-2">Message sent!</h2>
            <p className="text-[#7a7570] text-sm leading-relaxed mb-6">We'll get back to you soon.</p>
            <button
              onClick={() => onNavigate("settings")}
              className="px-6 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
            >
              Back to Settings
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#7a7570] mb-2 leading-relaxed">
              Have a question or feedback? We'd love to hear from you.
            </p>
            <p className="text-sm text-[#7a7570] mb-6 leading-relaxed">
              You can also email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#6c47ff] font-semibold">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-12 px-4 rounded-2xl border border-[#e8e4df] bg-white text-sm text-[#1a1a1a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-12 px-4 rounded-2xl border border-[#e8e4df] bg-white text-sm text-[#1a1a1a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl border border-[#e8e4df] bg-white text-sm text-[#1a1a1a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5] resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full h-13 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)", height: 52 }}
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

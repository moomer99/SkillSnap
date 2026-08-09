"use client";

import React from "react";
import { AppProvider } from "@/state/AppState";
import { ToastProvider } from "@/components/skillsnap/shared/Toast";
import DiscoverScreen from "@/components/skillsnap/DiscoverScreen";

function DiscoverInner() {
  function handleNavigate() {
    // Redirect to the main SPA for all navigation actions
    window.location.href = "/";
  }

  return <DiscoverScreen onNavigate={handleNavigate} />;
}

export default function DiscoverClientPage() {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="w-full max-w-[600px] mx-auto min-h-screen bg-[#0d0a1a]">
          <DiscoverInner />
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
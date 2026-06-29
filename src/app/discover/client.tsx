"use client";

import React from "react";
import { AppProvider, useAppState } from "@/state/AppState";
import { ToastProvider } from "@/components/skillsnap/shared/Toast";
import DiscoverScreen from "@/components/skillsnap/DiscoverScreen";

function DiscoverInner() {
  const { navigate } = useAppState();

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
        <div className="w-full max-w-[600px] mx-auto min-h-screen bg-[#f8f7f5]">
          <DiscoverInner />
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
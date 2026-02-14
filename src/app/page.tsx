"use client";

import { useState } from "react";
import { Coffee, Mic, List, BarChart3, UtensilsCrossed } from "lucide-react";
import VoiceWidget from "@/components/VoiceWidget";
import MenuContent from "@/components/MenuContent";
import OwnerDashboard from "@/components/OwnerDashboard";
import KitchenDisplayTab from "@/components/KitchenDisplayTab";

type TabId = "order" | "menu" | "dashboard" | "kitchen";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      <div className="w-full border-b border-[#e8e2d8] bg-[#faf8f5] py-3">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-2 text-[#5f473b] text-sm font-medium">
          <Coffee className="w-5 h-5 text-[#8b6a51]" aria-hidden />
          <span>Tarro · New York City</span>
        </div>
      </div>

      <HomeTabs />
    </div>
  );
}

function HomeTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("order");
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="max-w-4xl mx-auto w-full px-4 pt-6">
        <div className="flex rounded-xl bg-[#f0ebe3] p-1 border border-[#e8e2d8]">
          <TabButton
            active={activeTab === "order"}
            onClick={() => setActiveTab("order")}
            icon={<Mic className="w-4 h-4" />}
            label="Order"
          />
          <TabButton
            active={activeTab === "menu"}
            onClick={() => setActiveTab("menu")}
            icon={<List className="w-4 h-4" />}
            label="Menu"
          />
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Dashboard"
          />
          <TabButton
            active={activeTab === "kitchen"}
            onClick={() => setActiveTab("kitchen")}
            icon={<UtensilsCrossed className="w-4 h-4" />}
            label="Kitchen"
          />
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 md:py-8">
        {activeTab === "order" && (
          <div>
            <header className="text-center mb-6">
              <h1 className="font-display text-3xl md:text-4xl text-[#2a1f1a] tracking-tight">
                Order with your voice.
              </h1>
              <p className="mt-2 text-[#5f473b] max-w-lg mx-auto">
                Talk to our AI cashier—or type. No app, no line.
              </p>
            </header>
            <div className="flex justify-center">
              <VoiceWidget onOpenMenu={() => setActiveTab("menu")} />
            </div>
          </div>
        )}
        {activeTab === "menu" && (
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <MenuContent />
          </div>
        )}
        {activeTab === "dashboard" && (
          <div>
            <header className="mb-6">
              <h1 className="font-display text-2xl md:text-3xl text-[#2a1f1a]">Owner dashboard</h1>
              <p className="mt-1 text-[#5f473b]">Today&apos;s pulse</p>
            </header>
            <OwnerDashboard />
          </div>
        )}
        {activeTab === "kitchen" && (
          <div>
            <header className="mb-6">
              <h1 className="font-display text-2xl md:text-3xl text-[#2a1f1a]">Kitchen display</h1>
              <p className="mt-1 text-[#5f473b]">Order ticket queue</p>
            </header>
            <KitchenDisplayTab />
          </div>
        )}
      </div>

      <footer className="border-t border-[#e8e2d8] bg-[#f6f4f0] py-4 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-[#8b6a51]">
          Pay in-store · No app required
        </div>
      </footer>
    </div>
  );
}


function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-white text-[#2a1f1a] shadow border border-[#e8e2d8]"
          : "text-[#5f473b] hover:text-[#2a1f1a]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

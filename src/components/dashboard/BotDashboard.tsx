"use client";

import * as React from "react";
import { BotCard } from "./BotCard";
import { ChannelTabs } from "./ChannelTabs";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardToolbar } from "./DashboardToolbar";
import type { Bot, BotChannel } from "@/types/bot";

interface BotDashboardProps {
  bots: Bot[];
  userName: string;
  userEmail: string;
}

export function BotDashboard({ bots: initialBots, userName, userEmail }: BotDashboardProps) {
  const [bots, setBots] = React.useState(initialBots);
  const [search, setSearch] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState<BotChannel | "all">("all");

  const filteredBots = bots.filter((bot) => {
    const matchesChannel = channelFilter === "all" || bot.channel === channelFilter;
    const query = search.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      bot.name.toLowerCase().includes(query) ||
      bot.pageId.toLowerCase().includes(query);
    return matchesChannel && matchesQuery;
  });

  function handleToggleActive(id: string) {
    setBots((prev) =>
      prev.map((bot) => (bot.id === id ? { ...bot, isActive: !bot.isActive } : bot))
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-roboto">
      <DashboardNavbar userName={userName} userEmail={userEmail} />

      <main className="w-full py-6">
        <div className="mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1144px] space-y-2">
          {/* Khối 1: Header + Toolbar */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
            <h1 className="mb-4 text-base font-semibold text-slate-900">Bảng điều khiển</h1>
            <DashboardToolbar search={search} onSearchChange={setSearch} />
          </div>

          {/* Khối 2: Tabs chọn kênh */}
          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[8px]">
            <ChannelTabs bots={bots} value={channelFilter} onChange={setChannelFilter} />
          </div>

          {/* Khối 3: Danh sách các Bot */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5 min-h-[calc(100vh-320px)]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBots.map((bot, index) => (
                <BotCard key={bot.id} bot={bot} index={index} onToggleActive={handleToggleActive} />
              ))}
            </div>

            {filteredBots.length === 0 && (
              <p className="mt-10 text-center text-sm text-slate-400">
                Không tìm thấy bot/trang nào khớp với bộ lọc hiện tại.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

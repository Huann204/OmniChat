"use client";

import * as React from "react";
import { BotCard } from "./BotCard";
import { ChannelTabs } from "./ChannelTabs";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardToolbar } from "./DashboardToolbar";
import { MergePagesModal } from "./MergePagesModal";
import type { Bot, BotChannel } from "@/types/bot";

interface BotDashboardProps {
  bots: Bot[];
  userName: string;
  userEmail: string;
}

export function BotDashboard({ bots: initialBots, userName, userEmail }: BotDashboardProps) {
  const [bots, setBots] = React.useState(initialBots);
  const [prevInitialBots, setPrevInitialBots] = React.useState(initialBots);
  const [search, setSearch] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState<BotChannel | "all">("all");
  const [mergeModalOpen, setMergeModalOpen] = React.useState(false);

  // initialBots được tính lại ở server (getConnectedPages) mỗi khi
  // router.refresh() chạy — đồng bộ vào state cục bộ để danh sách hiện Page
  // vừa kết nối mà không cần user tự F5 trang. Đồng bộ ngay trong lúc render
  // (thay vì trong effect) để tránh render thừa.
  if (initialBots !== prevInitialBots) {
    setPrevInitialBots(initialBots);
    setBots(initialBots);
  }

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
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <DashboardNavbar userName={userName} userEmail={userEmail} className="!bg-none bg-transparent border-none shrink-0" />

      <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative">
        <div className="mx-auto flex h-full w-[calc(100%-2rem)] max-w-[1144px] flex-col space-y-2 sm:w-[calc(100%-3rem)]">
          {/* Khối 1: Header + Toolbar */}
          <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
            <h1 className="mb-4 text-base font-semibold text-slate-900">Bảng điều khiển</h1>
            <DashboardToolbar
              search={search}
              onSearchChange={setSearch}
              onOpenMerge={() => setMergeModalOpen(true)}
            />
          </div>

          {/* Khối 2: Tabs chọn kênh */}
          <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[8px]">
            <ChannelTabs bots={bots} value={channelFilter} onChange={setChannelFilter} />
          </div>

          {/* Khối 3: Danh sách các Bot */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
            <div className="flex-1 overflow-y-auto p-4 md:p-5">
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
        </div>
      </main>

      <MergePagesModal
        open={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        bots={bots}
      />
    </div>
  );
}

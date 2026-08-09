"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { NAV_TABS } from "@/lib/nav-tabs";
import { toast } from "@/store/toast-store";
import { SettingsSidebar } from "./SettingsSidebar";

interface SettingsShellProps {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

// Layout dùng chung cho mọi trang /settings/* — cùng khung navbar/tab với
// /dashboard và /livechat (xem DashboardNavbar), chỉ khác nội dung bên dưới
// là sidebar cài đặt + trang con thay vì danh sách bot/hội thoại.
export function SettingsShell({ userName, userEmail, children }: SettingsShellProps) {
  const router = useRouter();

  // "Cài đặt" đang mở sẵn (đang đứng trong /settings) — bấm tab khác thì rời
  // đi đúng nơi tab đó phụ trách, giống hệt cách BotDashboard xử lý
  // NAV_TABS[0] ("Hội thoại" -> /livechat, không kèm pageId = gộp toàn bộ
  // Page hiện có, xem livechat/page.tsx). Điều hướng thẳng bằng router.push,
  // không còn vòng qua Server Action ghi cookie + redirect như trước.
  function handleTabChange(tab: string) {
    if (tab === "Cài đặt") return;
    if (tab === NAV_TABS[0]) {
      router.push("/livechat");
      return;
    }
    toast.info("Tính năng đang được phát triển");
  }

  return (
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <DashboardNavbar
        userName={userName}
        userEmail={userEmail}
        tabs={NAV_TABS}
        activeTab="Cài đặt"
        onTabChange={handleTabChange}
        className="!bg-none bg-transparent border-none shrink-0"
      />

      <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
        <div className="mx-auto flex w-[calc(100%-2rem)] max-w-[1440px] items-start gap-4 sm:w-[calc(100%-3rem)]">
          <SettingsSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}

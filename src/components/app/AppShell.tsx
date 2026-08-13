"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { NAV_TABS } from "@/lib/nav-tabs";
import { toast } from "@/store/toast-store";
import type { ShopRole } from "@/types/shopMember";

interface AppShellProps {
  userName: string;
  userEmail: string;
  // Nhân viên (role="member") không được vào Cài đặt — ẩn hẳn tab, xem
  // settings/layout.tsx (chặn thật ở đó nếu cố tình vào thẳng URL).
  myRole: ShopRole | null;
  children: React.ReactNode;
}

// Suy activeTab trực tiếp từ URL hiện tại thay vì tự giữ state riêng — trước
// đây BotDashboard/InboxView/SettingsShell/ProfileShell mỗi cái tự quản lý 1
// bản activeTab độc lập (dễ lệch nhau), giờ chỉ có đúng 1 nguồn sự thật.
function tabForPathname(pathname: string): string | undefined {
  if (pathname.startsWith("/livechat")) return NAV_TABS[0];
  if (pathname.startsWith("/settings")) return "Cài đặt";
  return undefined;
}

// Khung dùng chung cho MỌI trang trong route group (app) — Dashboard,
// Livechat, Settings, Hồ sơ. DashboardNavbar chỉ mount ĐÚNG 1 LẦN ở đây (thay
// vì tự khai báo lặp lại ở từng trang như trước) nên không bị huỷ/dựng lại
// mỗi lần chuyển trang — đây là nguyên nhân khiến header trước đây trông như
// "load lại" mỗi lần điều hướng dù dữ liệu user không đổi.
export function AppShell({ userName, userEmail, myRole, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = myRole === "member" ? NAV_TABS.filter((tab) => tab !== "Cài đặt") : NAV_TABS;
  const activeTab = tabForPathname(pathname);

  function handleTabChange(tab: string) {
    if (tab === "Cài đặt") {
      router.push("/settings");
      return;
    }
    if (tab === NAV_TABS[0]) {
      router.push("/livechat");
      return;
    }
    toast.info("Tính năng đang được phát triển");
  }

  return (
    <div className="flex h-screen h-[100dvh] flex-col overflow-hidden bg-[rgb(80,109,173)] font-roboto">
      <DashboardNavbar
        userName={userName}
        userEmail={userEmail}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="!bg-none bg-transparent border-none shrink-0"
      />
      {children}
    </div>
  );
}

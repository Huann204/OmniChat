"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { NAV_TABS } from "@/lib/nav-tabs";
import { toast } from "@/store/toast-store";
import type { ShopRole } from "@/types/shopMember";

interface ProfileShellProps {
  userName: string;
  userEmail: string;
  // Nhân viên (role="member") vẫn được vào Hồ sơ (trang cá nhân, không phải
  // Cài đặt Shop) — chỉ ẩn tab "Cài đặt" trên navbar cho nhất quán với
  // BotDashboard/InboxView, không chặn gì thêm ở trang này.
  myRole: ShopRole | null;
  children: React.ReactNode;
}

// Khung navbar dùng riêng cho /profile — cùng navbar với /dashboard,
// /livechat, /settings nhưng KHÔNG có sidebar Cài đặt (Hồ sơ là trang cá
// nhân, không thuộc phạm vi quản trị Shop).
export function ProfileShell({ userName, userEmail, myRole, children }: ProfileShellProps) {
  const router = useRouter();
  const tabs = myRole === "member" ? NAV_TABS.filter((tab) => tab !== "Cài đặt") : NAV_TABS;

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
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <DashboardNavbar
        userName={userName}
        userEmail={userEmail}
        tabs={tabs}
        onTabChange={handleTabChange}
        className="!bg-none bg-transparent border-none shrink-0"
      />

      <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
        <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl sm:w-[calc(100%-3rem)]">{children}</div>
      </main>
    </div>
  );
}

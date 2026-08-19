"use client";

import * as React from "react";
import Link from "next/link";
import { BsFillBellFill, BsPersonFill, BsShieldLock } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ShopSwitcherMenu } from "@/components/dashboard/ShopSwitcherMenu";
import { useAuthStore } from "@/store/auth-store-provider";

interface DashboardNavbarProps {
  userName: string;
  userEmail: string;
  tabs?: readonly string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function DashboardNavbar({
  userName,
  userEmail,
  tabs,
  activeTab,
  onTabChange,
  className,
}: DashboardNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  // Ảnh đại diện lấy từ store (đồng bộ realtime sau khi đổi ở /profile, xem
  // ProfileEditor.tsx) — userName/userEmail vẫn giữ nguyên qua props như cũ.
  const avatarUrl = useAuthStore((state) => state.user?.avatarUrl);
  const isSupportAdmin = useAuthStore((state) => state.user?.isSupportAdmin);

  return (
    <header className={cn("bg-[rgb(80,109,173)]", className)}>
      <div className="mx-auto flex h-14 w-full px-3 sm:w-[calc(100%-2rem)] max-w-[1144px] items-center gap-2 sm:gap-4 md:gap-8 sm:w-[calc(100%-3rem)]">
        <Link href={tabs ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2 mr-1 sm:mr-4 md:mr-6">
          <img src="/hchat.png" alt="Hchat Logo" className="h-8 sm:h-10 w-auto object-contain" />
        </Link>

        {tabs && (
          <nav className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => {
              const href =
                tab === "Hội thoại"
                  ? "/livechat"
                  : tab === "Khách hàng"
                  ? "/customers"
                  : tab === "Bài viết"
                  ? "/posts/compose"
                  : tab === "Cài đặt"
                  ? "/settings/reply-support"
                  : undefined;

              const isCurrentActive = tab === activeTab;
              const classNameStr = cn(
                "shrink-0 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-normal transition-colors cursor-pointer",
                isCurrentActive
                  ? "bg-white/20 text-white"
                  : "text-white hover:bg-white/10 hover:text-white"
              );

              if (href) {
                return (
                  <Link key={tab} href={href} className={classNameStr}>
                    {tab}
                  </Link>
                );
              }

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange?.(tab)}
                  className={classNameStr}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <ShopSwitcherMenu />

          {/* Avatar user */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Mở menu tài khoản"
              title={userName}
              className="flex items-center rounded-full p-1 transition-colors hover:bg-white/15 cursor-pointer"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-700">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </span>
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="truncate text-xs text-slate-400">{userEmail}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50"
                  >
                    <BsPersonFill className="h-4 w-4" />
                    Hồ sơ
                  </Link>
                  {isSupportAdmin && (
                    <Link
                      href="/cms"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50"
                    >
                      <BsShieldLock className="h-4 w-4" />
                      CMS
                    </Link>
                  )}
                  <LogoutButton
                    variant="ghost"
                    className={cn(
                      "w-full justify-start rounded-none px-3 py-2 text-sm font-normal text-slate-700 hover:bg-slate-50"
                    )}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Thông báo"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
          >
            <BsFillBellFill className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

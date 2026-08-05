"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ShopSwitcherMenu } from "@/components/dashboard/ShopSwitcherMenu";

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

  return (
    <header className={cn("bg-[rgb(80,109,173)]", className)}>
      <div className="mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1144px] items-center gap-4 sm:w-[calc(100%-3rem)]">
        <Link href={tabs ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2 mr-6">
          {/* <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
            <img src="/logo.png" alt="OmniChat Logo" className="h-full w-full object-contain" />
          </span> */}
          <span className="hidden text-lg font-bold tracking-tight text-white sm:inline">OmniChat</span>
        </Link>

        {tabs && (
          <nav className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange?.(tab)}
                className={cn(
                  "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer",
                  tab === activeTab
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ShopSwitcherMenu />

          {/* Avatar user */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Mở menu tài khoản"
              title={userName}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/15 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700">
                {userName.charAt(0).toUpperCase()}
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
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

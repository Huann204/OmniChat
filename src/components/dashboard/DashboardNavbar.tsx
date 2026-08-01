"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface DashboardNavbarProps {
  userName: string;
  userEmail: string;
}

export function DashboardNavbar({ userName, userEmail }: DashboardNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="bg-gradient-to-r from-[#123B54] via-[#1B6E5C] to-[#2FA968]">
      <div className="mx-auto flex h-16 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1144px] items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
            <img src="/logo.png" alt="OmniChat Logo" className="h-full w-full object-contain" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">OmniChat</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Thông báo"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
          </button>

          {/* Avatar user */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Mở menu tài khoản"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/15 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm  text-white sm:inline">{userName}</span>
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
        </div>
      </div>
    </header>
  );
}

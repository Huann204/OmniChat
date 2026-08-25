"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV } from "@/lib/settings-nav";

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto w-full md:w-64 shrink-0 gap-1 md:space-y-1 rounded-2xl border border-slate-200/70 bg-white p-2 sm:p-3 shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] h-auto md:h-[calc(100vh-104px)]">
      {SETTINGS_NAV.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

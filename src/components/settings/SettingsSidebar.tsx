"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV } from "@/lib/settings-nav";

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-[calc(100vh-104px)] w-64 shrink-0 space-y-1 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[8px]">
      {SETTINGS_NAV.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
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

"use client";
import * as React from "react";
import type { ComponentType, SVGProps } from "react";
import { BsFillLayersFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import type { Bot, BotChannel } from "@/types/bot";

interface ChannelTabsProps {
  bots: Bot[];
  value: BotChannel | "all";
  onChange: (value: BotChannel | "all") => void;
}

export function ChannelTabs({ bots, value, onChange }: ChannelTabsProps) {
  const tabs: {
    key: BotChannel | "all";
    label: string;
    count: number;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    iconColor: string;
  }[] = [
    { key: "all", label: "Tất cả", count: bots.length, icon: BsFillLayersFill, iconColor: "text-slate-500" },
    ...(Object.keys(CHANNEL_META) as BotChannel[]).map((channel) => ({
      key: channel,
      label: CHANNEL_META[channel].label,
      count: bots.filter((b) => b.channel === channel).length,
      icon: CHANNEL_META[channel].icon,
      iconColor: CHANNEL_META[channel].badgeBg.replace("bg-", "text-"),
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {tabs.map((tab, idx) => {
        const active = value === tab.key;
        return (
          <React.Fragment key={tab.key}>
            {idx > 0 && <div className="h-4 w-[1px] bg-slate-200/80 mx-1 shrink-0" />}
            <button
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
                active
                  ? "bg-sky-100 text-sky-800"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              )}
            >
              <tab.icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-700" : tab.iconColor)} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold tabular-nums",
                  active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

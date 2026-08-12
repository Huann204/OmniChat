"use client";

import * as React from "react";
import {
  BsChatSquareTextFill,
  BsPersonCircle,
  BsChatFill,
  BsFillEnvelopeFill,
  BsFillStarFill,
  BsFillTelephoneFill,
  BsFillTelephoneXFill,
  BsFillClockFill,
  BsFillCalendarDateFill,
  BsFillLayersFill,
  BsFillPeopleFill,
} from "react-icons/bs";
import { cn } from "@/lib/utils";

const RAIL_ITEMS = [
  { id: "quick", icon: BsChatSquareTextFill, label: "Tin nhắn nhanh" },
  { id: "contacts", icon: BsPersonCircle, label: "Danh bạ" },
  { id: "chat", icon: BsChatFill, label: "Hội thoại" },
  { id: "mail", icon: BsFillEnvelopeFill, label: "Hộp thư" },
  { id: "star", icon: BsFillStarFill, label: "Đánh dấu sao" },
  { id: "phone", icon: BsFillTelephoneFill, label: "Cuộc gọi" },
  { id: "missed", icon: BsFillTelephoneXFill, label: "Cuộc gọi nhỡ" },
  { id: "clock", icon: BsFillClockFill, label: "Lịch sử" },
  { id: "calendar", icon: BsFillCalendarDateFill, label: "Lịch hẹn" },
  { id: "archive", icon: BsFillLayersFill, label: "Lưu trữ" },
  { id: "team", icon: BsFillPeopleFill, label: "Nhóm" },
] as const;

interface InboxIconRailProps {
  className?: string;
}

export function InboxIconRail({ className }: InboxIconRailProps = {}) {
  const [active, setActive] = React.useState<string>("chat");

  return (
    <nav className={cn("hidden md:flex w-13 shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-[rgb(80,109,173)] py-3", className)}>
      {RAIL_ITEMS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => setActive(id)}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg text-white/80 transition-colors cursor-pointer hover:bg-white/15 hover:text-white",
            active === id && "bg-white/20 text-white"
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </nav>
  );
}

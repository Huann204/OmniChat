"use client";

import * as React from "react";
import {
  MessageCircle,
  MessagesSquare,
  Mail,
  Star,
  Phone,
  PhoneMissed,
  Clock,
  Calendar,
  Archive,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RAIL_ITEMS = [
  { id: "contacts", icon: Users, label: "Danh bạ" },
  { id: "chat", icon: MessageCircle, label: "Hội thoại" },
  { id: "quick", icon: MessagesSquare, label: "Tin nhắn nhanh" },
  { id: "mail", icon: Mail, label: "Hộp thư" },
  { id: "star", icon: Star, label: "Đánh dấu sao" },
  { id: "phone", icon: Phone, label: "Cuộc gọi" },
  { id: "missed", icon: PhoneMissed, label: "Cuộc gọi nhỡ" },
  { id: "clock", icon: Clock, label: "Lịch sử" },
  { id: "calendar", icon: Calendar, label: "Lịch hẹn" },
  { id: "archive", icon: Archive, label: "Lưu trữ" },
] as const;

interface InboxIconRailProps {
  className?: string;
}

export function InboxIconRail({ className }: InboxIconRailProps = {}) {
  const [active, setActive] = React.useState<string>("chat");

  return (
    <nav className={cn("flex w-14 shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-[rgb(80,109,173)] py-3", className)}>
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
          <Icon className="h-4.5 w-4.5" />
        </button>
      ))}
    </nav>
  );
}

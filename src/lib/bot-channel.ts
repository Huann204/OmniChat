import React from "react";
import type { ComponentType, SVGProps } from "react";
import { BotChannel } from "@/types/bot";
import { FaWhatsapp } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";
import { BsGlobe2 } from "react-icons/bs";
import { cn } from "@/lib/utils";

export const CHANNEL_META: Record<
  BotChannel,
  {
    label: string;
    icon: ComponentType<any>;
    badgeBg: string;
    badgeText: string;
  }
> = {
  facebook: {
    label: "Facebook",
    icon: ({ className }: { className?: string }) => React.createElement('img', { src: '/facebook.png', alt: 'Facebook', className }),
    badgeBg: "bg-[#0866FF]",
    badgeText: "text-white",
  },
  zalo: {
    label: "Zalo",
    icon: ({ className }: { className?: string }) => React.createElement('img', { src: '/zalo.png', alt: 'Zalo', className }),
    badgeBg: "bg-[#0068FF]",
    badgeText: "text-white",
  },
  telegram: {
    label: "Telegram",
    icon: ({ className }: { className?: string }) =>
      React.createElement(SiTelegram, { className: cn("text-[#0088cc]", className) }),
    badgeBg: "bg-[#0088cc]",
    badgeText: "text-white",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: ({ className }: { className?: string }) =>
      React.createElement(FaWhatsapp, { className: cn("text-[#25D366]", className) }),
    badgeBg: "bg-[#25D366]",
    badgeText: "text-white",
  },
  website: {
    label: "Website",
    icon: ({ className }: { className?: string }) =>
      React.createElement(BsGlobe2, { className: cn("text-white", className) }),
    badgeBg: "bg-[#0f172a]",
    badgeText: "text-white",
  },
};

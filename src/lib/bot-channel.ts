import React from "react";
import type { ComponentType, SVGProps } from "react";
import { BotChannel } from "@/types/bot";
import { FaWhatsapp } from "react-icons/fa";

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
  whatsapp: {
    label: "WhatsApp",
    icon: FaWhatsapp,
    badgeBg: "bg-[#25D366]",
    badgeText: "text-white",
  },
};

import type { ComponentType, SVGProps } from "react";
import { BotChannel } from "@/types/bot";
import { FaFacebookMessenger, FaWhatsapp } from "react-icons/fa";
import { MessageCircle } from "lucide-react";

export const CHANNEL_META: Record<
  BotChannel,
  {
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    badgeBg: string;
    badgeText: string;
  }
> = {
  facebook: {
    label: "Facebook",
    icon: FaFacebookMessenger,
    badgeBg: "bg-[#0866FF]",
    badgeText: "text-white",
  },
  zalo: {
    label: "Zalo",
    icon: MessageCircle,
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

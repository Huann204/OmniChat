import type { ComponentType, SVGProps } from "react";
import {
  Cloud,
  History,
  MessageCircle,
  Monitor,
  Phone,
  RotateCw,
  Settings,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
}

// Khớp 1-1 với các thư mục có sẵn dưới next-base/src/app/settings/ — mỗi
// item ứng với đúng 1 route con (page.tsx riêng), dùng chung cho
// SettingsSidebar để hiện menu + biết mục nào đang active theo pathname.
export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/settings/general", label: "Cài đặt chung", icon: Settings },
  { href: "/settings/tags", label: "Thẻ hội thoại", icon: Tag },
  { href: "/settings/ai-assistant", label: "Trợ lý AI", icon: Sparkles, badge: "Beta" },
  { href: "/settings/reply-support", label: "Hỗ trợ trả lời", icon: MessageCircle },
  { href: "/settings/appearance", label: "Giao diện", icon: Monitor },
  { href: "/settings/calls", label: "Cuộc gọi", icon: Phone },
  { href: "/settings/rotation", label: "Chế độ xoay vòng", icon: RotateCw },
  { href: "/settings/sync", label: "Đồng bộ", icon: Cloud },
  { href: "/settings/tools", label: "Công cụ", icon: Wrench },
  { href: "/settings/permissions", label: "Phân quyền", icon: Users },
  { href: "/settings/history", label: "Lịch sử", icon: History },
];

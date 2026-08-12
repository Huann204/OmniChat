import type { ComponentType, SVGProps } from "react";
import {
  BsGearFill,
  BsTagFill,
  BsStars,
  BsChatFill,
  BsDisplayFill,
  BsFillTelephoneFill,
  BsArrowRepeat,
  BsCloudFill,
  BsWrench,
  BsFillPeopleFill,
  BsFillClockFill,
} from "react-icons/bs";

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
  { href: "/settings/general", label: "Cài đặt chung", icon: BsGearFill },
  { href: "/settings/tags", label: "Thẻ hội thoại", icon: BsTagFill },
  { href: "/settings/ai-assistant", label: "Trợ lý AI", icon: BsStars, badge: "Beta" },
  { href: "/settings/reply-support", label: "Hỗ trợ trả lời", icon: BsChatFill },
  { href: "/settings/appearance", label: "Giao diện", icon: BsDisplayFill },
  { href: "/settings/calls", label: "Cuộc gọi", icon: BsFillTelephoneFill },
  { href: "/settings/rotation", label: "Chế độ xoay vòng", icon: BsArrowRepeat },
  { href: "/settings/sync", label: "Đồng bộ", icon: BsCloudFill },
  { href: "/settings/tools", label: "Công cụ", icon: BsWrench },
  { href: "/settings/permissions", label: "Phân quyền", icon: BsFillPeopleFill },
  { href: "/settings/history", label: "Lịch sử", icon: BsFillClockFill },
];

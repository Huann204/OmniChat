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
  // Mục CHƯA phát triển — ẩn khỏi menu (xem VISIBLE_SETTINGS_NAV) và trang của nó
  // chuyển hướng về Cài đặt chung. Muốn bật lại: làm trang thật rồi xoá cờ này.
  comingSoon?: boolean;
}

// Khớp 1-1 với các thư mục có sẵn dưới next-base/src/app/settings/ — mỗi
// item ứng với đúng 1 route con (page.tsx riêng), dùng chung cho
// SettingsSidebar để hiện menu + biết mục nào đang active theo pathname.
export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/settings/general", label: "Cài đặt chung", icon: BsGearFill },
  { href: "/settings/tags", label: "Thẻ hội thoại", icon: BsTagFill },
  { href: "/settings/ai-assistant", label: "Trợ lý AI", icon: BsStars, badge: "Beta" },
  { href: "/settings/reply-support", label: "Hỗ trợ trả lời", icon: BsChatFill },
  { href: "/settings/appearance", label: "Giao diện", icon: BsDisplayFill, comingSoon: true },
  { href: "/settings/calls", label: "Cuộc gọi", icon: BsFillTelephoneFill, comingSoon: true },
  { href: "/settings/rotation", label: "Chế độ xoay vòng", icon: BsArrowRepeat },
  { href: "/settings/sync", label: "Đồng bộ", icon: BsCloudFill, comingSoon: true },
  { href: "/settings/tools", label: "Công cụ", icon: BsWrench, comingSoon: true },
  { href: "/settings/permissions", label: "Phân quyền", icon: BsFillPeopleFill },
  { href: "/settings/history", label: "Lịch sử", icon: BsFillClockFill, comingSoon: true },
];

// Danh sách thực sự hiện trong menu Cài đặt — đã loại các mục chưa phát triển.
export const VISIBLE_SETTINGS_NAV = SETTINGS_NAV.filter((item) => !item.comingSoon);

import type { ComponentType, SVGProps } from "react";
import { BsHeadset } from "react-icons/bs";

export interface CmsNavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Khớp 1-1 với các thư mục có sẵn dưới next-base/src/app/cms/ — mỗi item
// ứng với đúng 1 route con (page.tsx riêng), dùng chung cho CmsSidebar để
// hiện menu + biết mục nào đang active theo pathname. Thêm công cụ CMS mới
// sau này thì thêm route con + 1 dòng ở đây, giống cách settings-nav.ts làm.
export const CMS_NAV: CmsNavItem[] = [
  { href: "/cms/support", label: "Đổi Shop hỗ trợ", icon: BsHeadset },
];

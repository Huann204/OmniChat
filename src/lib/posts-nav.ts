import type { ComponentType, SVGProps } from "react";
import { BsPencilSquare, BsFileEarmarkText, BsFillClockFill, BsCheckCircleFill } from "react-icons/bs";

export interface PostsNavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// Khớp 1-1 với các thư mục có sẵn dưới next-base/src/app/(app)/posts/ — mỗi
// item ứng với đúng 1 route con, dùng chung cho PostsSidebar để hiện menu +
// biết mục nào đang active theo pathname.
export const POSTS_NAV: PostsNavItem[] = [
  { href: "/posts/compose", label: "Soạn bài", icon: BsPencilSquare },
  { href: "/posts/drafts", label: "Nháp", icon: BsFileEarmarkText },
  { href: "/posts/scheduled", label: "Đã lên lịch", icon: BsFillClockFill },
  { href: "/posts/history", label: "Lịch sử", icon: BsCheckCircleFill },
];

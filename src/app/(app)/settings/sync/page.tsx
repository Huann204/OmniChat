import { redirect } from "next/navigation";

// Mục này CHƯA phát triển — đã ẩn khỏi menu Cài đặt (xem lib/settings-nav.ts,
// cờ comingSoon). Ai gõ thẳng URL thì chuyển về Cài đặt chung thay vì hiện
// trang trống. Khi làm thật: thay file này bằng trang thật và bỏ cờ comingSoon.
export default function ComingSoonSettingsPage() {
  redirect("/settings/general");
}

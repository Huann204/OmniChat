import { redirect } from "next/navigation";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { getCurrentShopRole, verifySession } from "@/lib/dal";

// Nhân viên (role="member") không được vào bất kỳ trang Cài đặt nào — chặn
// ở tầng layout để áp dụng cho MỌI trang con (/settings/*) cùng lúc, không
// phải tự chặn riêng từng trang. null (không xác định được role, vd lỗi
// mạng) thì KHÔNG chặn — chỉ chặn khi biết chắc là "member", tránh khoá
// nhầm owner/admin chỉ vì 1 lần gọi API lỗi thoáng qua.
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [user, role] = await Promise.all([verifySession(), getCurrentShopRole()]);

  if (role === "member") {
    redirect("/livechat");
  }

  return (
    <SettingsShell userName={user.name} userEmail={user.email}>
      {children}
    </SettingsShell>
  );
}

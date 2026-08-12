import { redirect } from "next/navigation";
import { CmsSidebar } from "@/components/cms/CmsSidebar";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { verifySession } from "@/lib/dal";

// Khu vực quản trị nền tảng — TÁCH RIÊNG khỏi route group (app) (Dashboard/
// Livechat/Settings/Hồ sơ, luôn gắn với 1 Shop đang chọn) vì CMS không thuộc
// về Shop nào cả, chỉ nhân viên hỗ trợ nền tảng (isSupportAdmin) mới vào
// được. Chặn ở tầng layout để áp dụng cho MỌI trang con /cms/* sau này.
// Có sẵn sidebar (giống settings) để thêm công cụ CMS mới về sau — xem
// lib/cms-nav.ts.
export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession();

  if (!user.isSupportAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)] font-roboto">
      <DashboardNavbar userName={user.name} userEmail={user.email} tabs={[]} />

      <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
        <div className="mx-auto flex flex-col md:flex-row w-full px-3 sm:w-[calc(100%-2rem)] max-w-[1440px] items-start gap-4 sm:w-[calc(100%-3rem)]">
          <CmsSidebar />
          <div className="w-full min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}

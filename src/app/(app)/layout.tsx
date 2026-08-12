import { AppShell } from "@/components/app/AppShell";
import { getCurrentShopRole, verifySession } from "@/lib/dal";

// Layout dùng chung cho /dashboard, /livechat, /settings, /profile — chỗ DUY
// NHẤT gọi verifySession()/getCurrentShopRole() cho cả nhóm (trước đây mỗi
// trang tự gọi lại), và chỗ DUY NHẤT mount AppShell/DashboardNavbar để nó
// không bị huỷ + dựng lại mỗi lần chuyển trang giữa 4 khu vực này.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, myRole] = await Promise.all([verifySession(), getCurrentShopRole()]);

  return (
    <AppShell userName={user.name} userEmail={user.email} myRole={myRole}>
      {children}
    </AppShell>
  );
}

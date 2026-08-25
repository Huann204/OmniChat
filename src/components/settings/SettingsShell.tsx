import { SettingsSidebar } from "./SettingsSidebar";

interface SettingsShellProps {
  children: React.ReactNode;
}

// Navbar/tabs giờ sống ở AppShell (app/(app)/layout.tsx), dùng chung cho cả
// nhóm route — component này chỉ còn render sidebar Cài đặt + trang con,
// không còn cần "use client" vì không còn state/hook nào ở đây nữa.
export function SettingsShell({ children }: SettingsShellProps) {
  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
      <div className="mx-auto flex flex-col md:flex-row w-full px-3 sm:w-[calc(100%-2rem)] max-w-[1440px] items-start gap-4 sm:w-[calc(100%-3rem)]">
        <SettingsSidebar />
        <div className="w-full min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

import { PostsSidebar } from "./PostsSidebar";

interface PostsShellProps {
  children: React.ReactNode;
}

// Mirror SettingsShell.tsx — navbar/tabs sống ở AppShell (app/(app)/layout.tsx),
// component này chỉ còn render sidebar Bài viết + trang con.
export function PostsShell({ children }: PostsShellProps) {
  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto flex flex-col md:flex-row w-full px-3 sm:px-6 max-w-[1440px] items-start gap-4">
        <PostsSidebar />
        <div className="w-full min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

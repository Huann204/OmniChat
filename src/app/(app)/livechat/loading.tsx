import { InboxIconRail } from "@/components/inbox/InboxIconRail";

// Navbar giờ sống ở AppShell (app/(app)/layout.tsx) — đứng yên, không bị
// Suspense của loading.tsx này bọc lại khi trang con đang tải.
export default function LivechatLoading() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <InboxIconRail className="!bg-none bg-transparent border-none" />

      <div className="flex flex-1 min-w-0 overflow-hidden rounded-tl-xl bg-white">
        <div className="flex w-full md:w-[25%] xl:w-[400px] shrink-0 flex-col border-r border-slate-200 animate-pulse">
          <div className="border-b border-slate-100 p-3">
            <div className="h-9 rounded-xl bg-slate-100" />
          </div>
          <div className="flex-1 space-y-1 p-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-2.5 w-4/5 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex min-w-0 flex-1 flex-col animate-pulse">
          <div className="h-16 shrink-0 border-b border-slate-100" />
          <div className="flex-1" />
          <div className="h-16 shrink-0 border-t border-slate-100" />
        </div>

        <div className="hidden md:block w-[27%] shrink-0 border-l border-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

// Navbar giờ sống ở AppShell (app/(app)/layout.tsx) — đứng yên, không bị
// Suspense của loading.tsx này bọc lại khi trang con đang tải.
export default function ProfileLoading() {
  return (
    <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl space-y-4 pb-6 sm:w-[calc(100%-3rem)] animate-pulse">
        <div className="h-5 w-36 rounded bg-slate-200" />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
          <div className="mb-4 h-4 w-32 rounded bg-slate-100" />
          <div className="mb-5 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-slate-100" />
              <div className="h-2.5 w-40 rounded bg-slate-100" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
          <div className="mb-4 h-4 w-28 rounded bg-slate-100" />
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    </main>
  );
}

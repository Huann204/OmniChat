export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#123B54] via-[#1B6E5C] to-[#2FA968] font-roboto flex flex-col">
      <header className="bg-gradient-to-r from-[#123B54] via-[#1B6E5C] to-[#2FA968]">
        <div className="mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1144px] items-center sm:w-[calc(100%-3rem)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="OmniChat Logo" className="h-full w-full object-contain" />
          </span>
          <span className="hidden pl-2 text-lg font-bold tracking-tight text-white sm:inline">
            OmniChat
          </span>
        </div>
      </header>

      <main className="w-full flex-1 bg-slate-100 pt-6 pb-12 shadow-2xl relative">
        <div className="mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1144px] space-y-2 animate-pulse">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
            <div className="mb-4 h-4 w-40 rounded bg-slate-100" />
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-[8px]">
            <div className="h-6 w-64 rounded bg-slate-100" />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5 min-h-[calc(100vh-320px)]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 h-[84px]"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

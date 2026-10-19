export default function StatsLoading() {
  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-[1144px] space-y-3 sm:w-[calc(100%-3rem)] animate-pulse">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 md:p-5">
          <div className="mb-4 h-6 w-32 rounded-md bg-slate-200" />
          <div className="flex gap-2">
            <div className="h-10 w-56 rounded-lg bg-slate-100" />
            <div className="h-10 w-36 rounded-lg bg-slate-100" />
            <div className="h-10 w-36 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200/70 bg-white" />
          ))}
        </div>
        <div className="h-80 rounded-2xl border border-slate-200/70 bg-white" />
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="h-72 rounded-2xl border border-slate-200/70 bg-white" />
          <div className="h-72 rounded-2xl border border-slate-200/70 bg-white" />
        </div>
      </div>
    </main>
  );
}

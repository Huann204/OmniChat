export default function DraftsLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px]"
        >
          <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-1/4 rounded bg-slate-100" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-8 w-16 rounded-lg bg-slate-100" />
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

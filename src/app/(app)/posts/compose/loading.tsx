export default function ComposeLoading() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-xl bg-slate-100" />
      </div>

      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-32 w-full rounded-xl bg-slate-100" />
      </div>

      <div className="h-10 w-32 rounded-xl bg-slate-100" />

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <div className="h-10 w-28 rounded-xl bg-slate-200" />
        <div className="h-10 w-24 rounded-xl bg-slate-100" />
        <div className="h-10 w-24 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm space-y-5 animate-pulse">
      <div className="space-y-2 border-b border-slate-100 pb-4">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-3.5 w-72 rounded bg-slate-100" />
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-xl bg-slate-100" />
        </div>

        <div className="space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-xl bg-slate-100" />
        </div>

        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="h-10 w-28 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

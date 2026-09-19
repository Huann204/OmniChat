export default function CustomersLoading() {
  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
      <div className="mx-auto flex h-full w-[calc(100%-2rem)] max-w-[1144px] flex-col space-y-2 sm:w-[calc(100%-3rem)] animate-pulse">
        {/* Top Header & Filter Card */}
        <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
          <div className="mb-4 h-6 w-32 rounded-md bg-slate-200" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="h-10 flex-1 rounded-lg bg-slate-100" />
            <div className="h-10 w-full sm:w-36 rounded-lg bg-slate-100" />
            <div className="h-10 w-full sm:w-32 rounded-lg bg-slate-100" />
          </div>
        </div>

        {/* Table Container Card */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Kênh</th>
                  <th className="px-4 py-3">Tin nhắn gần nhất</th>
                  <th className="px-4 py-3">Thẻ</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="h-4 w-28 rounded bg-slate-200" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-44 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-4 w-12 rounded-full bg-slate-100" />
                        <div className="h-4 w-10 rounded-full bg-slate-100" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-16 rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import * as React from "react";
import { useTransition } from "react";
import { BsSearch } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { searchAllShops, switchShop, type SupportShopResult } from "@/app/actions/shop";

// Tìm + đổi vào Shop bất kỳ để hỗ trợ trực tiếp khách hàng — đổi thật vẫn
// dùng switchShop() y hệt luồng đổi Shop bình thường (xem
// services/shopMembership.service.ts#getActiveMembership ở BE, tự cấp quyền
// như owner cho nhân viên hỗ trợ dù không phải ShopMember thật).
export function ShopSupportSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SupportShopResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const shops = await searchAllShops(query);
      setResults(shops);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSwitch(shopId: string) {
    setSwitchingId(shopId);
    startTransition(async () => {
      await switchShop(shopId);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
      <p className="mb-4 text-xs text-slate-400">
        Tìm theo tên Shop hoặc tên/email chủ sở hữu — đổi vào sẽ có toàn quyền như chủ sở hữu Shop
        đó.
      </p>

      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tên Shop, tên hoặc email chủ sở hữu..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BsSearch className="h-4 w-4" />}
        </button>
      </form>

      <div className="max-h-96 space-y-1 overflow-y-auto">
        {searched && results.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">Không tìm thấy Shop nào.</p>
        )}
        {results.map((shop) => (
          <button
            key={shop.id}
            type="button"
            disabled={switchingId === shop.id}
            onClick={() => handleSwitch(shop.id)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-pointer disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {shop.name}
              </span>
              {shop.owner && (
                <span className="block truncate text-xs text-slate-400">
                  {shop.owner.name} · {shop.owner.email}
                </span>
              )}
            </span>
            {switchingId === shop.id && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

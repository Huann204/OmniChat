"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store-provider";
import type { AuthShop } from "@/store/auth-store";
import { createShop, switchShop, type ShopFormState } from "@/app/actions/shop";

const SHOP_ROLE_LABELS: Record<AuthShop["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Nhân viên",
};

export function ShopSwitcherMenu() {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  const shops = useAuthStore((state) => state.shops);
  const currentShopId = useAuthStore((state) => state.currentShopId);
  const currentShop = shops.find((s) => s.id === currentShopId);

  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  function handleSwitch(shop: AuthShop) {
    if (shop.id === currentShopId) {
      setOpen(false);
      return;
    }
    setSwitchingId(shop.id);
    startTransition(async () => {
      await switchShop(shop.id);
    });
  }

  if (!currentShop) return null;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Chuyển Shop"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-lg py-1 pl-2 pr-1.5 transition-colors hover:bg-white/15 cursor-pointer"
        >
          <span className="hidden flex-col items-end leading-tight sm:flex">
            <span className="max-w-[180px] truncate text-sm font-semibold text-white">
              {currentShop.name}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
              {SHOP_ROLE_LABELS[currentShop.role]}
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-white/80 transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-100 p-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Tạo shop
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 pt-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Tên shop</span>
                <span>Quyền</span>
              </div>

              <div className="max-h-72 overflow-y-auto pb-2">
                {filteredShops.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-slate-400">
                    Không tìm thấy shop nào.
                  </p>
                )}
                {filteredShops.map((shop) => {
                  const isCurrent = shop.id === currentShopId;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      disabled={switchingId === shop.id}
                      onClick={() => handleSwitch(shop)}
                      className={cn(
                        "grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-2.5 text-left transition-colors disabled:cursor-pointer disabled:opacity-60",
                        isCurrent ? "bg-primary/5" : "hover:bg-slate-50"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {shop.name}
                        </span>
                        {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        {switchingId === shop.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {SHOP_ROLE_LABELS[shop.role]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <CreateShopModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function CreateShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const initialState: ShopFormState = {};
  const [state, formAction, pending] = useActionState(createShop, initialState);

  return (
    <Modal open={open} onClose={onClose} title="Tạo Shop mới" className="max-w-md">
      <form action={formAction} className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label htmlFor="shop-name" className="text-sm font-medium text-slate-700">
            Tên Shop
          </label>
          <input
            id="shop-name"
            name="name"
            placeholder="VD: Shop Thời Trang ABC"
            defaultValue={state?.name}
            required
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>

        {state?.error && <p className="text-sm font-medium text-red-500">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Tạo shop
          </button>
        </div>
      </form>
    </Modal>
  );
}

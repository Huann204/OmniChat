"use client";

import * as React from "react";
import Link from "next/link";
import { BsBoxArrowRight, BsInfoCircleFill } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { leaveShop, updateShopInfo } from "@/app/actions/shop";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import type { ShopRole } from "@/types/shopMember";

const MAX_SHOP_NAME_LENGTH = 80;

interface GeneralSettingsClientProps {
  shop: { id: string; name: string };
  role: ShopRole;
}

// Cài đặt chung của Shop: đổi tên và rời Shop. Chủ Shop và quản trị viên mới
// sửa được tên (server cũng chặn, xem shop.routes.ts); nhân viên thường chỉ
// xem. Xoá Shop CHƯA có ở đây — cần ngắt toàn bộ kênh đang chạy nền trước.
export function GeneralSettingsClient({ shop: initialShop, role }: GeneralSettingsClientProps) {
  const [shop, setShop] = React.useState(initialShop);
  const [name, setName] = React.useState(initialShop.name);
  const [savingName, setSavingName] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [leavePending, startLeave] = React.useTransition();

  const canEdit = role === "owner" || role === "admin";
  const trimmedName = name.trim();
  const nameDirty = trimmedName !== shop.name;

  async function handleSaveName() {
    if (!trimmedName) {
      toast.error("Tên Shop không được để trống");
      return;
    }
    setSavingName(true);
    const result = await updateShopInfo(shop.id, { name: trimmedName });
    setSavingName(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setShop(result.shop);
    setName(result.shop.name);
    toast.success("Đã lưu tên Shop");
  }

  function handleLeave() {
    startLeave(async () => {
      const result = await leaveShop(shop.id);
      // Thành công thì redirect() đã chuyển trang, tới đây chỉ có nhánh lỗi.
      if (result?.error) {
        toast.error(result.error);
        setLeaveOpen(false);
      }
    });
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Cài đặt chung</h1>

      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Thông tin Shop</h2>
            <p className="mt-0.5 text-sm text-slate-500">Tên Shop hiện ở menu chuyển Shop của tất cả thành viên.</p>
          </div>

          <div className="p-5">
            <label htmlFor="shop-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tên Shop
            </label>
            <input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canEdit && nameDirty && !savingName) void handleSaveName();
              }}
              maxLength={MAX_SHOP_NAME_LENGTH}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-slate-50 disabled:text-slate-500 sm:text-sm"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>
                {canEdit
                  ? "Chủ Shop và quản trị viên mới sửa được."
                  : "Chỉ chủ Shop hoặc quản trị viên mới sửa được thông tin này."}
              </span>
              <span>
                {name.length}/{MAX_SHOP_NAME_LENGTH}
              </span>
            </div>

            {canEdit && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => void handleSaveName()}
                  disabled={!nameDirty || savingName || !trimmedName}
                >
                  {savingName ? "Đang lưu..." : "Lưu tên"}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Rời Shop</h2>
          </div>

          {role === "owner" ? (
            <div className="flex gap-3 p-5 text-sm text-slate-600">
              <BsInfoCircleFill className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p>
                Bạn là <strong>chủ sở hữu</strong> nên không thể rời Shop. Muốn rời, hãy{" "}
                <Link href="/settings/permissions" className="font-medium text-primary hover:underline">
                  chuyển quyền sở hữu
                </Link>{" "}
                cho người khác trước.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Bạn sẽ mất quyền truy cập Shop này. Các hội thoại bạn đang phụ trách được trả về mục &quot;Chưa phân
                công&quot; để người khác nhận.
              </p>
              <button
                type="button"
                onClick={() => setLeaveOpen(true)}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <BsBoxArrowRight className="h-4 w-4" />
                Rời Shop
              </button>
            </div>
          )}
        </section>
      </div>

      <Modal open={leaveOpen} onClose={() => !leavePending && setLeaveOpen(false)} className="w-full max-w-sm p-5">
        <h2 className="text-base font-semibold text-slate-900">Rời &quot;{shop.name}&quot;?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Bạn sẽ không còn truy cập được Shop này, và chỉ vào lại được khi chủ Shop hoặc quản trị viên thêm bạn lần
          nữa. Các hội thoại bạn đang phụ trách sẽ được trả về mục &quot;Chưa phân công&quot;.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setLeaveOpen(false)}
            disabled={leavePending}
            className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleLeave}
            disabled={leavePending}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {leavePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Rời Shop
          </button>
        </div>
      </Modal>
    </div>
  );
}

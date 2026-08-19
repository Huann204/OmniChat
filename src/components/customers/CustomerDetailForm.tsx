"use client";

import * as React from "react";
import Link from "next/link";
import { BsArrowLeft } from "react-icons/bs";
import { CHANNEL_META } from "@/lib/bot-channel";
import { formatTimeLabel } from "@/lib/message-format";
import { toast } from "@/store/toast-store";
import { updateCustomer, type CustomerItem } from "@/app/actions/customer";

const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
  2: CHANNEL_META.telegram,
} as const;

interface PageInfo {
  name: string;
  avatarUrl?: string;
}

export function CustomerDetailForm({
  customer,
  pagesById,
}: {
  customer: CustomerItem;
  pagesById: Record<string, PageInfo>;
}) {
  const [name, setName] = React.useState(customer.name);
  const [phone, setPhone] = React.useState(customer.phone);
  const [note, setNote] = React.useState(customer.note);
  const [saving, setSaving] = React.useState(false);

  const dirty = name !== customer.name || phone !== customer.phone || note !== customer.note;

  async function handleSave() {
    setSaving(true);
    const result = await updateCustomer(customer.id, { name, phone, note });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã lưu thông tin khách hàng");
  }

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
      >
        <BsArrowLeft className="h-4 w-4" />
        Danh sách khách hàng
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          {customer.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={customer.avatarUrl}
              alt={customer.name}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900">{customer.name}</p>
            <p className="text-xs text-slate-400">
              {customer.conversations.length > 0
                ? `Nhắn qua ${customer.conversations.length} kênh`
                : "Chưa gắn hội thoại nào"}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Chưa có số điện thoại"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="Ghi chú riêng về khách hàng này..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {customer.conversations.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Hội thoại đang gắn</h2>
          <div className="space-y-2">
            {customer.conversations.map((conv) => {
              const channelMeta =
                CHANNEL_META_BY_TYPE[conv.type as keyof typeof CHANNEL_META_BY_TYPE];
              const page = pagesById[conv.pageId];
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2"
                >
                  {channelMeta && <channelMeta.icon className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {page?.name ?? channelMeta?.label ?? "Kênh"}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatTimeLabel(conv.lastMessageAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

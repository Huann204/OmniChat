"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { setConversationTags } from "@/app/actions/conversationTag";
import { updateCustomerInfo } from "@/app/actions/customer";
import { setMergePagesCookie } from "@/lib/mergePagesCookie";
import { CHANNEL_META } from "@/lib/bot-channel";
import { toast } from "@/store/toast-store";
import type { Customer } from "@/types/customer";
import type { ConversationTag } from "@/types/conversationTag";

const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
  2: CHANNEL_META.telegram,
  3: CHANNEL_META.website,
} as const;

interface CustomerDetailModalProps {
  customer: Customer;
  allTags: ConversationTag[];
  onClose: () => void;
  onTagsChange: (tags: ConversationTag[]) => void;
}

export function CustomerDetailModal({ customer, allTags, onClose, onTagsChange }: CustomerDetailModalProps) {
  const router = useRouter();
  const [savingTags, setSavingTags] = React.useState(false);
  const [phone, setPhone] = React.useState(customer.customerPhone || "");
  const [email, setEmail] = React.useState(customer.customerEmail || "");
  const [address, setAddress] = React.useState(customer.customerAddress || "");

  // Không kênh nào (Facebook/Zalo/Telegram) tự cấp sẵn SĐT/email/địa chỉ qua
  // API nền tảng — đây là nơi DUY NHẤT nhân viên tự nhập tay các field này,
  // lưu ngay khi rời khỏi ô nhập (blur), chỉ gọi API nếu giá trị thật sự đổi.
  async function handleSaveField(field: "customerPhone" | "customerEmail" | "customerAddress", value: string, original: string) {
    if (value === original) return;
    const result = await updateCustomerInfo(customer.id, { [field]: value });
    if ("error" in result) {
      toast.error(result.error);
    }
  }

  async function handleToggleTag(tagId: string) {
    if (savingTags) return;
    const hasTag = customer.tags.some((t) => t.id === tagId);
    const nextTagIds = hasTag
      ? customer.tags.filter((t) => t.id !== tagId).map((t) => t.id)
      : [...customer.tags.map((t) => t.id), tagId];

    setSavingTags(true);
    const result = await setConversationTags(customer.id, nextTagIds);
    setSavingTags(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    onTagsChange(result.tags);
  }

  function handleOpenInLivechat() {
    setMergePagesCookie([customer.connectedPageId]);
    // customer.id CHÍNH LÀ id Conversation (1 dòng Khách hàng = 1 Conversation,
    // xem types/customer.ts) — Livechat đọc conversationId để mở thẳng đúng
    // hội thoại này, xem livechat/page.tsx + InboxView.tsx#initialConversationPromise.
    router.push(`/livechat?conversationId=${customer.id}`);
  }

  const channel = CHANNEL_META_BY_TYPE[customer.type as keyof typeof CHANNEL_META_BY_TYPE];
  const ChannelIcon = channel?.icon;
  const visitorInfoEntries = Object.entries(customer.visitorInfo ?? {});

  return (
    <Modal open onClose={onClose} title={customer.customerName} className="max-w-lg">
      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
        <div className="flex items-center gap-3">
          {customer.customerAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={customer.customerAvatarUrl}
              alt={customer.customerName}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-300 text-base font-bold text-white">
              {customer.customerName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{customer.customerName}</p>
            {channel && (
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                {ChannelIcon && <ChannelIcon className="h-3.5 w-3.5" />}
                {channel.label} · {customer.pageName}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Thông tin liên hệ
          </p>
          <div className="space-y-2.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleSaveField("customerPhone", phone.trim(), customer.customerPhone || "")}
                placeholder="Chưa có"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleSaveField("customerEmail", email.trim(), customer.customerEmail || "")}
                placeholder="Chưa có"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => handleSaveField("customerAddress", address.trim(), customer.customerAddress || "")}
                placeholder="Chưa có"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {visitorInfoEntries.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Thông tin khách điền
            </p>
            <div className="space-y-1.5">
              {visitorInfoEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">{key}:</span>
                  <span className="text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Thẻ</p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const active = customer.tags.some((t) => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  disabled={savingTags}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed"
                  style={{ background: tag.color, opacity: active ? 1 : 0.35 }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-slate-200 px-5 py-3.5">
        <button
          type="button"
          onClick={handleOpenInLivechat}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <MessageCircle className="h-4 w-4" />
          Mở trong Livechat
        </button>
      </div>
    </Modal>
  );
}

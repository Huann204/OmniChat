"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BsGlobe2 } from "react-icons/bs";
import { Modal } from "@/components/ui/Modal";
import { EmbedSnippetBlock } from "@/components/dashboard/EmbedSnippetBlock";
import { WidgetPreview } from "@/components/dashboard/WidgetPreview";
import { updateWebsiteChannel } from "@/app/actions/facebook";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";

interface EditWebsiteWidgetModalProps {
  open: boolean;
  onClose: () => void;
  bot: Bot;
}

// Chỉ dùng cho bot.channel === "website" — nơi Shop chỉnh MỌI THỨ sau khi
// kết nối (lúc tạo chỉ hỏi tên/tên miền/logo tối thiểu, xem
// AddConnectionModal.tsx#WebsiteConnectPanel). Prefill từ bot.widgetConfig +
// bot.domain (server trả về, xem lib/dal.ts#getConnectedPages).
export function EditWebsiteWidgetModal({ open, onClose, bot }: EditWebsiteWidgetModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState(bot.name);
  const [domain, setDomain] = React.useState(bot.domain || "");
  const [logoUrl, setLogoUrl] = React.useState(bot.avatarUrl || "");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState(bot.widgetConfig?.primaryColor || "#2563eb");
  const [greeting, setGreeting] = React.useState(bot.widgetConfig?.greeting || "Xin chào! Bạn cần hỗ trợ gì?");
  const [position, setPosition] = React.useState<"left" | "right">(bot.widgetConfig?.position || "right");
  const [saving, setSaving] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // Mã nhúng KHÔNG đổi theo thời gian (pageId/widgetKey cố định từ lúc tạo) —
  // trước đây chỉ hiện đúng 1 lần ngay sau khi tạo xong (WebsiteConnectPanel),
  // đóng modal đó là mất, không có chỗ xem lại. Tự tính lại y hệt ở đây bằng
  // window.location.origin (component chỉ render ở client, xem Modal.tsx —
  // không lo lệch hydrate SSR/CSR vì server không bao giờ render nội dung
  // modal cả).
  const snippet =
    typeof window !== "undefined"
      ? `<script src="${window.location.origin}/widget.js" data-key="${bot.pageId}" async></script>`
      : "";

  // Đồng bộ lại state mỗi lần mở modal cho ĐÚNG bot (tránh giữ state cũ từ
  // lần mở trước nếu component không bị unmount giữa 2 lần mở).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(bot.name);
      setDomain(bot.domain || "");
      setLogoUrl(bot.avatarUrl || "");
      setPrimaryColor(bot.widgetConfig?.primaryColor || "#2563eb");
      setGreeting(bot.widgetConfig?.greeting || "Xin chào! Bạn cần hỗ trợ gì?");
      setPosition(bot.widgetConfig?.position || "right");
    }
  }

  // Tái dùng nguyên pipeline upload ảnh chung của thư viện Media — giống hệt
  // WebsiteConnectPanel.tsx lúc tạo mới.
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chọn được file ảnh");
      return;
    }

    const formData = new FormData();
    formData.append("files", file);
    setUploadingLogo(true);
    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.items?.[0]?.url) {
        toast.error(data?.message || "Tải logo thất bại");
        return;
      }
      setLogoUrl(data.items[0].url);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateWebsiteChannel(bot.id, {
      name: name.trim() || bot.name,
      domain: domain.trim(),
      picture: logoUrl,
      primaryColor,
      greeting: greeting.trim(),
      position,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã lưu thay đổi");
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa kênh Website" className="max-w-3xl">
      <div className="flex max-h-[70vh]">
      <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Mã nhúng</label>
          <EmbedSnippetBlock snippet={snippet} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed"
            title="Đổi logo"
          >
            {uploadingLogo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <BsGlobe2 className="h-5 w-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Tên kênh</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tên miền</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="VD: shop-cua-ban.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Màu chủ đạo</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-200 p-1"
              />
              <span className="text-xs text-slate-400">{primaryColor}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Vị trí</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "left" | "right")}
              className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="right">Góc phải</option>
              <option value="left">Góc trái</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Lời chào</label>
          <input
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Xem trước trực quan — cập nhật ngay khi đổi màu/logo/lời chào/vị
          trí, để Shop thấy kết quả TRƯỚC KHI lưu, không phải đoán rồi ra
          website thật kiểm tra lại. Ẩn ở màn hình hẹp (modal co về w-full,
          không đủ chỗ đặt 2 cột) — form vẫn dùng được bình thường, chỉ mất
          phần xem trước. */}
      <div className="hidden w-64 shrink-0 border-l border-slate-200 bg-slate-50/50 p-4 md:block">
        <WidgetPreview
          name={name}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          greeting={greeting}
          position={position}
        />
      </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </button>
      </div>
    </Modal>
  );
}

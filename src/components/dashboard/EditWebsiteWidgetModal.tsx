"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { BsGlobe2 } from "react-icons/bs";
import { Modal } from "@/components/ui/Modal";
import { EmbedSnippetBlock } from "@/components/dashboard/EmbedSnippetBlock";
import { WidgetPreview } from "@/components/dashboard/WidgetPreview";
import { updateWebsiteChannel } from "@/app/actions/facebook";
import {
  PRE_CHAT_FIELD_LABELS,
  DEFAULT_PRE_CHAT_FIELDS,
  EMPTY_CONTACT_CHANNELS,
  type PreChatField,
  type ContactChannels,
} from "@/lib/preChatFields";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";
import { cn } from "@/lib/utils";

interface EditWebsiteWidgetModalProps {
  open: boolean;
  onClose: () => void;
  bot: Bot;
}

// Page CŨ (tạo trước khi field này tồn tại) hoặc do Mongoose tự default mảng
// thành [] thay vì để trống -> preChatFields có thể là mảng RỖNG dù Shop
// chưa từng cấu hình gì, không chỉ là undefined. Coi cả 2 trường hợp là
// "chưa cấu hình" để không hiện bảng trống trơn cho kênh mới tạo.
function resolvePreChatFields(configured: PreChatField[] | undefined): PreChatField[] {
  return configured && configured.length > 0 ? configured : DEFAULT_PRE_CHAT_FIELDS;
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
  const [preChatFields, setPreChatFields] = React.useState<PreChatField[]>(
    resolvePreChatFields(bot.widgetConfig?.preChatFields)
  );
  // Shop CHƯA từng cấu hình (bot.widgetConfig.preChatFields rỗng/chưa có) VÀ
  // chưa mở tab này trong lượt sửa hiện tại -> KHÔNG gửi preChatFields lên
  // server lúc lưu, dù state đã prefill sẵn DEFAULT_PRE_CHAT_FIELDS để hiện
  // preview. Tránh việc Shop mở modal chỉ để đổi màu/logo rồi bấm Lưu lại VÔ
  // TÌNH bật luôn form bắt buộc (3 trường mặc định required=true) mà họ
  // không hề hay biết — chỉ thật sự bật khi Shop CHỦ ĐỘNG mở tab "Form trước
  // khi chat".
  const [touchedPrechatTab, setTouchedPrechatTab] = React.useState(
    !!bot.widgetConfig?.preChatFields?.length
  );
  // contactChannels KHÔNG cần cờ "touched" như preChatFields — 3 ô đều bắt
  // đầu rỗng nếu Shop chưa cấu hình, lưu lại y nguyên rỗng đó cũng không có
  // tác dụng phụ gì (khác preChatFields có sẵn giá trị mặc định "required:
  // true" gây bật form ngoài ý muốn), nên luôn gửi kèm mỗi lần Lưu.
  const [contactChannels, setContactChannels] = React.useState<ContactChannels>({
    ...EMPTY_CONTACT_CHANNELS,
    ...bot.widgetConfig?.contactChannels,
  });
  const [tab, setTab] = React.useState<"appearance" | "contact" | "prechat">("appearance");
  const [saving, setSaving] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  function updatePreChatField(index: number, patch: Partial<PreChatField>) {
    setPreChatFields((fields) =>
      fields.map((f, i) => {
        if (i !== index) return f;
        const next = { ...f, ...patch };
        // Ẩn thì không thể bắt buộc điền được — đồng bộ với server (xem
        // websiteChannel.controller.ts#parsePreChatFields).
        if (!next.visible) next.required = false;
        return next;
      })
    );
  }

  function movePreChatField(index: number, direction: -1 | 1) {
    setPreChatFields((fields) => {
      const target = index + direction;
      if (target < 0 || target >= fields.length) return fields;
      const next = [...fields];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

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
      setPreChatFields(resolvePreChatFields(bot.widgetConfig?.preChatFields));
      setTouchedPrechatTab(!!bot.widgetConfig?.preChatFields?.length);
      setContactChannels({ ...EMPTY_CONTACT_CHANNELS, ...bot.widgetConfig?.contactChannels });
      setTab("appearance");
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
      ...(touchedPrechatTab ? { preChatFields } : {}),
      contactChannels: {
        facebook: contactChannels.facebook?.trim() || "",
        zalo: contactChannels.zalo?.trim() || "",
        phone: contactChannels.phone?.trim() || "",
      },
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
      <div className="flex gap-1 border-b border-slate-200 px-6 pt-1">
        <button
          type="button"
          onClick={() => setTab("appearance")}
          className={cn(
            "cursor-pointer border-b-2 px-2 py-2 text-sm font-medium transition-colors",
            tab === "appearance"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Giao diện
        </button>
        <button
          type="button"
          onClick={() => setTab("contact")}
          className={cn(
            "cursor-pointer border-b-2 px-2 py-2 text-sm font-medium transition-colors",
            tab === "contact"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Kênh liên hệ
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("prechat");
            setTouchedPrechatTab(true);
          }}
          className={cn(
            "cursor-pointer border-b-2 px-2 py-2 text-sm font-medium transition-colors",
            tab === "prechat"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Form trước khi chat
        </button>
      </div>
      <div className="flex max-h-[70vh]">
      <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {tab === "appearance" ? (
        <>
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
        </>
        ) : tab === "contact" ? (
        <>
        <p className="text-xs text-slate-500">
          Hiện cùng màn hình với form &quot;trước khi chat&quot; (nếu có) khi
          khách mở khung chat — bấm vào là chuyển thẳng sang kênh đó. Để
          trống thì bỏ qua, khách vào thẳng form/khung chat như bình thường.
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Facebook Messenger</label>
          <input
            type="text"
            value={contactChannels.facebook}
            onChange={(e) => setContactChannels((c) => ({ ...c, facebook: e.target.value }))}
            placeholder="https://m.me/tenpage"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Zalo</label>
          <input
            type="text"
            value={contactChannels.zalo}
            onChange={(e) => setContactChannels((c) => ({ ...c, zalo: e.target.value }))}
            placeholder="Số điện thoại Zalo hoặc link zalo.me/..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Số điện thoại</label>
          <input
            type="text"
            value={contactChannels.phone}
            onChange={(e) => setContactChannels((c) => ({ ...c, phone: e.target.value }))}
            placeholder="090xxxxxxx"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        </>
        ) : (
        <>
        <p className="text-xs text-slate-500">
          Bật (Hiển thị) trường nào thì khách phải điền form này TRƯỚC KHI vào
          được khung chat. Tắt hết -&gt; khách vào chat ngay như bình thường.
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1fr_1fr_70px_70px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Thông tin trường</span>
            <span>Lưu vào biến</span>
            <span className="text-center">Bắt buộc</span>
            <span className="text-center">Hiển thị</span>
          </div>
          {preChatFields.map((field, index) => (
            <div
              key={field.key}
              className={cn(
                "grid grid-cols-[1fr_1fr_70px_70px] items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0",
                !field.visible && "bg-slate-50/70"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => movePreChatField(index, -1)}
                    disabled={index === 0}
                    className="cursor-pointer text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Đưa lên"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePreChatField(index, 1)}
                    disabled={index === preChatFields.length - 1}
                    className="cursor-pointer text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Đưa xuống"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className={cn("truncate text-sm font-medium", field.visible ? "text-slate-800" : "text-slate-400")}>
                  {PRE_CHAT_FIELD_LABELS[field.key]}
                </span>
              </div>
              <input
                type="text"
                value={field.variable}
                onChange={(e) => updatePreChatField(index, { variable: e.target.value })}
                className="min-w-0 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <label className="mx-auto flex cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  disabled={!field.visible}
                  onChange={(e) => updatePreChatField(index, { required: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />
              </label>
              <label className="mx-auto flex cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={field.visible}
                  onChange={(e) => updatePreChatField(index, { visible: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
              </label>
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      {/* Xem trước trực quan — cập nhật ngay khi đổi màu/logo/lời chào/vị
          trí, để Shop thấy kết quả TRƯỚC KHI lưu, không phải đoán rồi ra
          website thật kiểm tra lại. Ẩn ở màn hình hẹp (modal co về w-full,
          không đủ chỗ đặt 2 cột) — form vẫn dùng được bình thường, chỉ mất
          phần xem trước. Đổi mode theo tab đang mở để luôn khớp nội dung Shop
          đang chỉnh. */}
      <div className="hidden w-64 shrink-0 border-l border-slate-200 bg-slate-50/50 p-4 md:block">
        <WidgetPreview
          name={name}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          greeting={greeting}
          position={position}
          mode={tab === "appearance" ? "chat" : "gate"}
          preChatFields={preChatFields}
          contactChannels={contactChannels}
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

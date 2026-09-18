"use client";

import { cn } from "@/lib/utils";
import { PRE_CHAT_FIELD_LABELS, type PreChatField, type ContactChannels } from "@/lib/preChatFields";

interface WidgetPreviewProps {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  greeting: string;
  position: "left" | "right";
  // "gate" mô phỏng màn hình "cổng" trước khi vào khung chat thật — GỘP
  // CHUNG form "trước khi chat" (Tên bạn/Email...) và "kênh liên hệ nhanh"
  // (Facebook/Zalo/gọi điện) trên CÙNG 1 màn hình, đúng như widget.js thật
  // (xem app/widget.js/route.ts#buildGateScreen) — Shop đang ở tab nào trong
  // 2 tab ("Form trước khi chat"/"Kênh liên hệ") cũng thấy preview gộp y hệt
  // vì đó là những gì khách THẬT SỰ nhìn thấy. Dùng chung khung ngoài (bong
  // bóng nổi + thẻ trắng bo góc) với "chat" (mặc định), chỉ đổi nội dung bên
  // trong.
  mode?: "chat" | "gate";
  preChatFields?: PreChatField[];
  contactChannels?: ContactChannels;
}

const CONTACT_CHANNEL_META: Record<keyof ContactChannels, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877F2" },
  zalo: { label: "Zalo", color: "#0068FF" },
  phone: { label: "Gọi điện", color: "#FF7A00" },
};

// Mô phỏng trực quan widget.js thật (bong bóng + khung chat đang mở) — KHÔNG
// nhúng script thật (widget.js gọi API thật + Shadow DOM, không hợp để chạy
// thử ngay trong modal Cài đặt), chỉ dựng lại ĐÚNG bố cục/màu sắc bằng React
// để Shop thấy ngay ảnh hưởng của từng lựa chọn TRƯỚC KHI lưu, xem
// EditWebsiteWidgetModal.tsx. Đổi CSS trong widget.js (app/widget.js/route.ts)
// thì nhớ đổi lại đây cho khớp, không có cơ chế dùng chung 1 nguồn CSS vì bên
// kia là chuỗi JS thuần nhúng vào website ngoài, bên này là component React.
export function WidgetPreview({
  name,
  logoUrl,
  primaryColor,
  greeting,
  position,
  mode = "chat",
  preChatFields = [],
  contactChannels,
}: WidgetPreviewProps) {
  const isLeft = position === "left";
  const visiblePreChatFields = preChatFields.filter((f) => f.visible);
  const activeContactChannels = (Object.keys(CONTACT_CHANNEL_META) as (keyof ContactChannels)[]).filter(
    (key) => contactChannels?.[key]?.trim()
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
      <p className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Xem trước
      </p>
      <div className="relative flex-1 p-3">
        {/* Khung chat — luôn hiện "đang mở" trong bản xem trước, khác widget
            thật (mặc định đóng, mở khi bấm bong bóng). */}
        <div
          className={cn(
            "absolute bottom-14 w-[210px] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5",
            isLeft ? "left-1" : "right-1"
          )}
        >
          {mode === "gate" ? (
            <div className="p-3">
              {visiblePreChatFields.length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-slate-800">Bắt đầu trò chuyện</p>
                  <p className="mb-2.5 text-[10px] text-slate-400">Vui lòng nhập thông tin bên dưới</p>
                  <div className="space-y-1.5">
                    {visiblePreChatFields.map((f) => (
                      <div key={f.key}>
                        <p className="mb-0.5 text-[10px] font-medium text-slate-500">
                          {PRE_CHAT_FIELD_LABELS[f.key]}
                          {f.required && <span className="text-red-500"> *</span>}
                        </p>
                        <div className="h-5 rounded-md border border-slate-200 bg-slate-50" />
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div
                className="mt-2.5 flex h-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ background: primaryColor }}
              >
                Bắt đầu trò chuyện
              </div>
              {activeContactChannels.length > 0 && (
                <>
                  <p className="mb-1.5 mt-3 text-[10px] font-medium text-slate-500">
                    Liên hệ qua kênh yêu thích của bạn
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeContactChannels.map((key) => {
                      const meta = CONTACT_CHANNEL_META[key];
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {meta.label}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 text-white" style={{ background: primaryColor }}>
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                )}
                <span className="truncate text-xs font-semibold">{name || "Website"}</span>
              </div>
              <div className="bg-slate-50 p-2.5">
                <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-slate-200 px-2.5 py-1.5 text-[11px] leading-snug text-slate-700">
                  {greeting || "Xin chào! Bạn cần hỗ trợ gì?"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-t border-slate-200 bg-white px-2 py-1.5">
                <div className="flex-1 truncate rounded-full border border-slate-200 px-2 py-1 text-[10px] text-slate-300">
                  Nhập tin nhắn...
                </div>
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: primaryColor }}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bong bóng chat nổi */}
        <div
          className={cn(
            "absolute bottom-0 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-white shadow-md",
            isLeft ? "left-1" : "right-1"
          )}
          style={{ background: primaryColor }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.61 1.28 4.95 3.32 6.61L4 22l4.5-1.5C9.6 20.83 10.78 21 12 21c5.52 0 10-4.03 10-9s-4.48-10-10-10z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Conversation, MessageKind } from "@/types/conversation";

export interface RawAttachment {
  type: string;
  url: string;
  // Tên file gốc — chỉ có ở file MÌNH gửi đi (xem
  // server/src/models/message.model.ts#IMessageAttachment), tin nhận từ
  // khách hiện không có tên gốc.
  name?: string;
}

export const ATTACHMENT_LABELS: Record<string, string> = {
  sticker: "[Nhãn dán]",
  lottie: "[Nhãn dán]",
  image: "[Hình ảnh]",
  video: "[Video]",
  audio: "[Tin nhắn thoại]",
  file: "[Tệp đính kèm]",
};

const ATTACHMENT_KIND: Record<string, MessageKind> = {
  sticker: "sticker",
  // Sticker Lottie của Telegram (.tgs — JSON nén gzip, không phải ảnh/video
  // thường) — render riêng bằng LottieSticker.tsx (giải nén + lottie-web),
  // xem MessageThread.tsx.
  lottie: "lottie",
  image: "image",
  video: "video",
};

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "mkv", "avi", "3gp", "m4v", "wmv"];

// Zalo gửi file video (khách chọn từ máy, không phải quay trực tiếp trong
// khung chat) qua CÙNG msgType "share.file" như file thường — Message.type
// lưu lại là "file" chung chung, không có cách nào phân biệt được từ type đó.
// Nhận diện thêm theo ĐUÔI FILE (đọc từ url hoặc tên gốc) để gắn đúng nhãn
// "[Video]" thay vì "[Tệp đính kèm]" khi tin không có tên gốc — không ảnh
// hưởng cách hiển thị (video vẫn render như file thường, chỉ bấm vào mới
// xem được, xem MessageThread.tsx).
function looksLikeVideo(attachment: RawAttachment): boolean {
  const source = attachment.name || attachment.url;
  const ext = source.split("?")[0].split(".").pop()?.toLowerCase();
  return !!ext && VIDEO_EXTENSIONS.includes(ext);
}

export function messagePreviewText(
  text: string | undefined,
  attachments?: RawAttachment[]
): string | undefined {
  if (text) return text;
  const first = attachments?.[0];
  if (first) return ATTACHMENT_LABELS[first.type] ?? "[Tệp đính kèm]";
  return undefined;
}

// Dùng để render TRONG khung chat — ảnh/nhãn dán giữ nguyên URL để hiển thị
// thật thay vì collapse về text preview.
export function messageKindAndContent(
  text: string | undefined,
  attachments: RawAttachment[] | undefined
): { kind: MessageKind; text?: string; attachmentUrls?: string[] } {
  const first = attachments?.[0];
  if (first) {
    const kind = ATTACHMENT_KIND[first.type] ?? "file";
    // File video (khách chọn từ máy, msgType chung "share.file" của Zalo) —
    // CỐ TÌNH giữ nguyên kind "file" (hiện thẻ link "bấm mở tab mới" như cũ,
    // KHÔNG nhúng <video> trực tiếp) — khác hẳn video "thật" (msgType riêng,
    // vd Zalo chat.video.msg) mới được nhúng <video>, xem MessageThread.tsx.
    // Chỉ mượn nhãn "[Video]" cho đẹp thay vì "[Tệp đính kèm]" chung chung.
    const looksVideoFile = kind === "file" && looksLikeVideo(first);
    // Ảnh có thể nhiều cái gộp chung 1 tin nhắn (Facebook trả về/mình gửi đi
    // đều qua attachments dạng mảng) — gom hết url ảnh lại để hiện chung 1
    // bong bóng. Sticker/video/file luôn chỉ có đúng 1 attachment.
    const urls =
      kind === "image"
        ? attachments!.filter((a) => a.type === "image").map((a) => a.url)
        : [first.url];
    return {
      kind,
      attachmentUrls: urls,
      // Ảnh/sticker/video "thật" (nhúng trực tiếp trong khung chat) có thể
      // kèm chú thích (gõ chữ + gửi cùng 1 tin) — giữ lại `text` thật nếu có,
      // KHÔNG hiện tên file/nhãn chung chung đè lên (đã có video/ảnh hiện
      // trực tiếp rồi, không cần thêm tên bên dưới). File thật (kể cả file
      // trông giống video) vẫn ưu tiên hiện đúng tên file gốc (nếu có, chỉ
      // có khi MÌNH gửi đi) thay vì nhãn chung chung.
      text:
        kind === "image" || kind === "sticker" || kind === "video" || kind === "lottie"
          ? text || undefined
          : first.name ||
            (looksVideoFile ? ATTACHMENT_LABELS.video : ATTACHMENT_LABELS[first.type]) ||
            "[Tệp đính kèm]",
    };
  }
  return { kind: "text", text };
}

const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

function dateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}

export function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (dateKey(date) === dateKey(now)) return formatClock(iso);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dateKey(date) === dateKey(yesterday)) return "Hôm qua";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

export function getLastMessagePreview(conversation: Conversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return "";
  if (last.kind === "call_request") return "Đã gửi yêu cầu gọi điện";
  if (last.kind === "call_outgoing") return "Cuộc gọi đi";
  if (last.kind === "call_missed") return "Cuộc gọi bị từ chối";
  if (last.text) return last.text;
  return ATTACHMENT_LABELS[last.kind] ?? "";
}

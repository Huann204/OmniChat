import type { Conversation, MessageKind } from "@/types/conversation";

export interface RawAttachment {
  type: string;
  url: string;
}

export const ATTACHMENT_LABELS: Record<string, string> = {
  sticker: "[Nhãn dán]",
  image: "[Hình ảnh]",
  video: "[Video]",
  audio: "[Tin nhắn thoại]",
  file: "[Tệp đính kèm]",
};

const ATTACHMENT_KIND: Record<string, MessageKind> = {
  sticker: "sticker",
  image: "image",
  video: "video",
};

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
      text: kind === "image" || kind === "sticker" ? undefined : ATTACHMENT_LABELS[first.type] ?? "[Tệp đính kèm]",
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

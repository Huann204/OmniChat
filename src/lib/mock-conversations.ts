import type { Conversation } from "@/types/conversation";

const CUSTOMER_NAMES = [
  "Nguyen Van Huan",
  "Trần Thị Mai",
  "Lê Hoàng Nam",
  "Phạm Thu Hà",
  "Đỗ Quang Minh",
  "Vũ Ngọc Anh",
  "Bùi Thanh Tùng",
];

function buildFirstConversation(botId: string): Conversation {
  return {
    id: `${botId}-c1`,
    botId,
    customerName: "Nguyen Van Huan",
    lastSeenLabel: "Phương Thảo đã xem",
    timeLabel: "23:08 hôm qua",
    isRead: true,
    messages: [
      { id: "m1", sender: "system", kind: "text", text: "Hôm qua", time: "" },
      { id: "m2", sender: "customer", kind: "text", text: "check", time: "10:41" },
      { id: "m3", sender: "page", kind: "text", text: "oki", time: "10:42" },
      { id: "m4", sender: "customer", kind: "text", text: "tôi muốn mua hàng", time: "11:20" },
      {
        id: "m5",
        sender: "page",
        kind: "call_request",
        text: "Đã gửi yêu cầu gọi điện",
        meta: "Nếu được chấp nhận, bạn có thể gọi cho người đó trong vòng 7 ngày tới.",
        time: "11:21",
      },
      { id: "m6", sender: "customer", kind: "text", text: "Cho phép gọi", time: "11:30" },
      { id: "m7", sender: "page", kind: "call_outgoing", text: "Cuộc gọi đi", meta: "0 phút 48 giây", time: "11:45" },
      {
        id: "m8",
        sender: "page",
        kind: "call_missed",
        text: "Cuộc gọi bị từ chối",
        meta: "Nhấn để gọi lại",
        time: "11:53",
      },
    ],
  };
}

function buildSimpleConversation(botId: string, index: number): Conversation {
  const name = CUSTOMER_NAMES[index % CUSTOMER_NAMES.length];
  const previews = [
    "Shop ơi còn hàng không ạ?",
    "Cho mình xin giá sỉ với",
    "Đơn của mình bao giờ giao vậy shop",
    "Mình muốn đổi size",
    "Cảm ơn shop nhé",
    "Sản phẩm này còn màu đen không?",
  ];
  const preview = previews[index % previews.length];
  const timeLabels = ["09:15", "Hôm qua", "2 ngày trước", "Thứ 2", "09:41", "1 tuần trước"];
  const timeLabel = timeLabels[index % timeLabels.length];

  return {
    id: `${botId}-c${index + 2}`,
    botId,
    customerName: name,
    lastSeenLabel: index % 3 === 0 ? "Đã xem" : "Đã gửi",
    timeLabel,
    isRead: index % 2 !== 0,
    messages: [
      { id: `${botId}-c${index + 2}-m1`, sender: "customer", kind: "text", text: preview, time: "09:1" + index },
    ],
  };
}

export function getConversationsForBot(botId: string): Conversation[] {
  const conversations = [buildFirstConversation(botId)];
  for (let i = 0; i < 6; i += 1) {
    conversations.push(buildSimpleConversation(botId, i));
  }
  return conversations;
}

export function getLastMessagePreview(conversation: Conversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return "";
  if (last.kind === "call_request") return "Đã gửi yêu cầu gọi điện";
  if (last.kind === "call_outgoing") return "Cuộc gọi đi";
  if (last.kind === "call_missed") return "Cuộc gọi bị từ chối";
  return last.text ?? "";
}

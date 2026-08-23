export type BotChannel = "facebook" | "zalo" | "telegram" | "whatsapp";

// Mirror server/src/models/connectedPage.model.ts#ConnectedPageStatus.
export type BotStatus = "active" | "inactive" | "deleted";

export interface Bot {
  id: string;
  pageId: string;
  name: string;
  channel: BotChannel;
  profileUrl: string;
  status: BotStatus;
  messageCount: number;
  orderCount: number;
  avatarUrl?: string;
  // Chatbot tự động đang gán cho Page này (xem
  // server/src/models/connectedPage.model.ts#chatbotId) — undefined = chưa
  // gán bot nào. Dùng ở AssignChatbotPagesModal.tsx để biết Page nào đang
  // thuộc bot khác trước khi cho gán lại.
  chatbotId?: string;
}

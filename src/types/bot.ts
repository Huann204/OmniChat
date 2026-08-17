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
}

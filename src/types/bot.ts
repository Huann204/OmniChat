export type BotChannel = "facebook" | "zalo" | "whatsapp";

export interface Bot {
  id: string;
  pageId: string;
  name: string;
  channel: BotChannel;
  profileUrl: string;
  isActive: boolean;
  messageCount: number;
  orderCount: number;
  avatarUrl?: string;
}

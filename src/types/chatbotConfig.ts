export interface ChatbotConfig {
  id: string;
  name: string;
  instructions: string;
  model: string;
  // true = bot đang TỰ ĐỘNG gửi thật cho mọi Page đã gán (bấm "Xuất bản" ở
  // AiChatbotBuilder.tsx) — xem server/src/services/chatbotAutoReply.service.ts.
  autoReplyEnabled: boolean;
}

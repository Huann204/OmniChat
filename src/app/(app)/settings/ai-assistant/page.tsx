import type { Metadata } from "next";
import { AiAssistantSettingsClient } from "@/components/settings/AiAssistantSettingsClient";

export const metadata: Metadata = {
  title: "Cấu hình AI Assistant",
};
import { getAiAssistantSettings, getChatbotConfigs } from "@/lib/dal";

export default async function AiAssistantSettingsPage() {
  const [settings, chatbots] = await Promise.all([getAiAssistantSettings(), getChatbotConfigs()]);
  return <AiAssistantSettingsClient initialSettings={settings} initialChatbots={chatbots} />;
}

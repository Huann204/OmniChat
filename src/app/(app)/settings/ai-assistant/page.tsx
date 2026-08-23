import type { Metadata } from "next";
import { AiAssistantSettingsClient } from "@/components/settings/AiAssistantSettingsClient";

export const metadata: Metadata = {
  title: "Cấu hình AI Assistant",
};
import { getAiAssistantSettings, getChatbotConfigs, getConnectedPages } from "@/lib/dal";

export default async function AiAssistantSettingsPage() {
  const [settings, chatbots, pages] = await Promise.all([
    getAiAssistantSettings(),
    getChatbotConfigs(),
    getConnectedPages(),
  ]);
  return (
    <AiAssistantSettingsClient initialSettings={settings} initialChatbots={chatbots} pages={pages} />
  );
}

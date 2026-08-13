import type { Metadata } from "next";
import { AiAssistantSettingsClient } from "@/components/settings/AiAssistantSettingsClient";

export const metadata: Metadata = {
  title: "Cấu hình AI Assistant",
};
import { getAiAssistantSettings } from "@/lib/dal";

export default async function AiAssistantSettingsPage() {
  const settings = await getAiAssistantSettings();
  return <AiAssistantSettingsClient initialSettings={settings} />;
}

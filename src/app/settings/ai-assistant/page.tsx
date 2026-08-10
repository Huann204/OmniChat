import { AiAssistantSettingsClient } from "@/components/settings/AiAssistantSettingsClient";
import { getAiAssistantSettings } from "@/lib/dal";

export default async function AiAssistantSettingsPage() {
  const settings = await getAiAssistantSettings();
  return <AiAssistantSettingsClient initialSettings={settings} />;
}

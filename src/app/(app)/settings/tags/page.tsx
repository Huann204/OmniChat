import { ConversationTagManager } from "@/components/settings/ConversationTagManager";
import { getConversationTags } from "@/lib/dal";

export default async function TagsSettingsPage() {
  const items = await getConversationTags();
  return <ConversationTagManager initialItems={items} />;
}

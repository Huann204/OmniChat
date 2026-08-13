import type { Metadata } from "next";
import { ConversationTagManager } from "@/components/settings/ConversationTagManager";

export const metadata: Metadata = {
  title: "Thẻ phân loại",
};
import { getConversationTags } from "@/lib/dal";

export default async function TagsSettingsPage() {
  const items = await getConversationTags();
  return <ConversationTagManager initialItems={items} />;
}

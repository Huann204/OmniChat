import { QuickReplyManager } from "@/components/settings/QuickReplyManager";
import { getQuickReplies } from "@/lib/dal";

export default async function ReplySupportSettingsPage() {
  const items = await getQuickReplies();
  return <QuickReplyManager initialItems={items} />;
}

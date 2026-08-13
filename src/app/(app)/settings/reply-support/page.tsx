import type { Metadata } from "next";
import { QuickReplyManager } from "@/components/settings/QuickReplyManager";

export const metadata: Metadata = {
  title: "Hỗ trợ trả lời",
};
import { getQuickReplies } from "@/lib/dal";

export default async function ReplySupportSettingsPage() {
  const items = await getQuickReplies();
  return <QuickReplyManager initialItems={items} />;
}

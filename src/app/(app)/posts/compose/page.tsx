import type { Metadata } from "next";
import { getConnectedPages } from "@/lib/dal";
import { PostComposer } from "@/components/posts/PostComposer";

export const metadata: Metadata = {
  title: "Soạn bài viết",
};

export default async function ComposePostPage() {
  const bots = await getConnectedPages();
  const facebookPages = bots.filter((b) => b.channel === "facebook");

  return <PostComposer facebookPages={facebookPages} />;
}

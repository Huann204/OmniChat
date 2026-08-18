import type { Metadata } from "next";
import { getConnectedPages, getPosts } from "@/lib/dal";
import { PostComposer } from "@/components/posts/PostComposer";

export const metadata: Metadata = {
  title: "Soạn bài viết",
};

export default async function ComposePostPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>;
}) {
  const { draftId } = await searchParams;
  const bots = await getConnectedPages();
  const facebookPages = bots.filter((b) => b.channel === "facebook");

  // Mở lại 1 bài nháp đã lưu để đăng/hẹn giờ (xem PostList.tsx#"Đăng bài
  // này") — getPosts("draft") rồi tìm đúng id thay vì thêm 1 endpoint lấy
  // 1 bài riêng, danh sách nháp thường không nhiều.
  const editingPost = draftId
    ? (await getPosts("draft")).find((p) => p.id === draftId)
    : undefined;

  return <PostComposer facebookPages={facebookPages} editingPost={editingPost} />;
}

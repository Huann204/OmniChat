import type { Metadata } from "next";
import { getPosts } from "@/lib/dal";
import { PostList } from "@/components/posts/PostList";

export const metadata: Metadata = {
  title: "Lịch sử bài viết",
};

export default async function PostHistoryPage() {
  // Lịch sử gồm cả "published" lẫn "failed" — không lọc được 2 status cùng
  // lúc qua getPosts(status?) (chỉ nhận 1 giá trị), gọi không truyền status
  // để lấy hết rồi tự lọc bỏ draft/scheduled ở đây.
  const posts = await getPosts();
  const history = posts.filter((p) => p.status === "published" || p.status === "failed");
  return <PostList posts={history} emptyLabel="Chưa có bài viết nào được đăng." />;
}

import type { Metadata } from "next";
import { getPosts } from "@/lib/dal";
import { PostList } from "@/components/posts/PostList";

export const metadata: Metadata = {
  title: "Bài viết nháp",
};

export default async function DraftsPage() {
  const posts = await getPosts("draft");
  return <PostList posts={posts} emptyLabel="Chưa có bài viết nháp nào." />;
}

import type { Metadata } from "next";
import { getPosts } from "@/lib/dal";
import { PostList } from "@/components/posts/PostList";

export const metadata: Metadata = {
  title: "Bài viết đã lên lịch",
};

export default async function ScheduledPostsPage() {
  const posts = await getPosts("scheduled");
  return <PostList posts={posts} emptyLabel="Chưa có bài viết nào được lên lịch." />;
}

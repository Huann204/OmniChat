import { PostsShell } from "@/components/posts/PostsShell";

// Không giới hạn role (khác Settings) — mọi thành viên Shop soạn/đăng bài
// được, giống cách gửi tin nhắn hiện tại không bị giới hạn role.
export default function PostsLayout({ children }: { children: React.ReactNode }) {
  return <PostsShell>{children}</PostsShell>;
}

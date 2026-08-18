import { redirect } from "next/navigation";

export default function PostsIndexPage() {
  redirect("/posts/compose");
}

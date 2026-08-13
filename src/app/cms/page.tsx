import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Quản trị CMS",
};

export default function CmsIndexPage() {
  redirect("/cms/support");
}

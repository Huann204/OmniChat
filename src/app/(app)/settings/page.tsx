import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cài đặt",
};

export default function SettingsIndexPage() {
  redirect("/settings/reply-support");
}

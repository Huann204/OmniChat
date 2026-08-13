import type { Metadata } from "next";
import { BsCloudFill } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Đồng bộ dữ liệu",
};

export default function SyncSettingsPage() {
  return <SettingsPlaceholder title="Đồng bộ" icon={BsCloudFill} />;
}

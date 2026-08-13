import type { Metadata } from "next";
import { BsWrench } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Công cụ tích hợp",
};

export default function ToolsSettingsPage() {
  return <SettingsPlaceholder title="Công cụ" icon={BsWrench} />;
}

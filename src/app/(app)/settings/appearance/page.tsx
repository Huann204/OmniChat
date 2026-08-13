import type { Metadata } from "next";
import { BsDisplayFill } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Giao diện",
};

export default function AppearanceSettingsPage() {
  return <SettingsPlaceholder title="Giao diện" icon={BsDisplayFill} />;
}

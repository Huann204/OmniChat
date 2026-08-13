import type { Metadata } from "next";
import { BsGearFill } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Cài đặt chung",
};

export default function GeneralSettingsPage() {
  return <SettingsPlaceholder title="Cài đặt chung" icon={BsGearFill} />;
}

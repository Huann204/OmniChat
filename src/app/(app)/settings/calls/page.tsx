import type { Metadata } from "next";
import { BsFillTelephoneFill } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Cuộc gọi",
};

export default function CallsSettingsPage() {
  return <SettingsPlaceholder title="Cuộc gọi" icon={BsFillTelephoneFill} />;
}

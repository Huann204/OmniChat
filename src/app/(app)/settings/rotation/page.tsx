import type { Metadata } from "next";
import { BsArrowRepeat } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Chế độ xoay vòng",
};

export default function RotationSettingsPage() {
  return <SettingsPlaceholder title="Chế độ xoay vòng" icon={BsArrowRepeat} />;
}

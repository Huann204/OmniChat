import type { Metadata } from "next";
import { BsFillClockFill } from "react-icons/bs";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata: Metadata = {
  title: "Lịch sử hoạt động",
};

export default function HistorySettingsPage() {
  return <SettingsPlaceholder title="Lịch sử" icon={BsFillClockFill} />;
}

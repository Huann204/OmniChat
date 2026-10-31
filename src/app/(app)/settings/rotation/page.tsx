import type { Metadata } from "next";
import { getRotationSettings } from "@/app/actions/rotation";
import { RotationSettingsClient } from "@/components/settings/RotationSettingsClient";
import { getCurrentShopRole, getShopMembers } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Chế độ xoay vòng",
};

export default async function RotationSettingsPage() {
  const [myRole, members] = await Promise.all([getCurrentShopRole(), getShopMembers()]);
  // Chỉ chủ/quản trị viên gọi được API cấu hình — nhân viên thường không gọi
  // (tránh 1 request chắc chắn 403), client tự hiện thông báo thay vì form.
  const canEdit = myRole === "owner" || myRole === "admin";
  const settings = canEdit ? await getRotationSettings() : { enabled: false, userIds: [] };

  return <RotationSettingsClient initialSettings={settings} members={members} myRole={myRole} />;
}

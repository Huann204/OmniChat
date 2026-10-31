import type { Metadata } from "next";
import { GeneralSettingsClient } from "@/components/settings/GeneralSettingsClient";
import { getCurrentShop } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Cài đặt chung",
};

export default async function GeneralSettingsPage() {
  const current = await getCurrentShop();

  if (!current) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Cài đặt chung</h1>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-sm text-slate-500 shadow-[8px]">
          Chưa chọn Shop nào. Hãy chọn hoặc tạo Shop ở menu phía trên.
        </div>
      </div>
    );
  }

  // key theo id Shop — đổi Shop thì dựng lại form từ đầu, không giữ state tên/
  // logo của Shop trước.
  return <GeneralSettingsClient key={current.shop.id} shop={current.shop} role={current.role} />;
}

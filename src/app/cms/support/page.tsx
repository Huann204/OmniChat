import type { Metadata } from "next";
import { ShopSupportSearch } from "@/components/cms/ShopSupportSearch";

export const metadata: Metadata = {
  title: "Hỗ trợ CMS",
};

export default function CmsSupportPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Đổi Shop hỗ trợ</h1>
      <ShopSupportSearch />
    </div>
  );
}

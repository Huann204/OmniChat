import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConnectedPages, getCustomerDetail } from "@/lib/dal";
import { CustomerDetailForm } from "@/components/customers/CustomerDetailForm";

export const metadata: Metadata = {
  title: "Chi tiết khách hàng",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, connectedPages] = await Promise.all([
    getCustomerDetail(id),
    getConnectedPages(),
  ]);
  if (!customer) notFound();

  const pagesById = Object.fromEntries(
    connectedPages.map((p) => [p.pageId, { name: p.name, avatarUrl: p.avatarUrl }])
  );

  return (
    <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl sm:w-[calc(100%-3rem)]">
        <CustomerDetailForm customer={customer} pagesById={pagesById} />
      </div>
    </main>
  );
}

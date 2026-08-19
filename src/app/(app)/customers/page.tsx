import type { Metadata } from "next";
import { getConnectedPages, getCustomers } from "@/lib/dal";
import { CustomerList } from "@/components/customers/CustomerList";
import { CustomerListPagination } from "@/components/customers/CustomerListPagination";

export const metadata: Metadata = {
  title: "Khách hàng",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ items, page: currentPage, pages }, connectedPages] = await Promise.all([
    getCustomers(page),
    getConnectedPages(),
  ]);

  // Tra tên/avatar Page nguồn theo id thật (Facebook Page id/Zalo OA id) —
  // để mỗi khách hiện rõ đang nhắn qua Page nào, mirror ConversationList.tsx.
  const pagesById = Object.fromEntries(
    connectedPages.map((p) => [p.pageId, { name: p.name, avatarUrl: p.avatarUrl }])
  );

  return (
    <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-4xl sm:w-[calc(100%-3rem)]">
        <h1 className="mb-4 text-lg font-bold text-slate-900">Khách hàng</h1>
        <CustomerList items={items} pagesById={pagesById} />
        <CustomerListPagination currentPage={currentPage} totalPages={pages} />
      </div>
    </main>
  );
}

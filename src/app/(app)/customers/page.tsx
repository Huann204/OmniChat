import type { Metadata } from "next";
import { CustomerList } from "@/components/customers/CustomerList";
import { getConversationTags, getCustomers } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Khách hàng",
};

export default async function CustomersPage() {
  const [{ customers, hasMore }, allTags] = await Promise.all([
    getCustomers(),
    getConversationTags(),
  ]);

  return <CustomerList initialCustomers={customers} initialHasMore={hasMore} allTags={allTags} />;
}

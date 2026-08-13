import type { Metadata } from "next";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata: Metadata = {
  title: "Trang cá nhân",
};
import { verifySession } from "@/lib/dal";

export default async function ProfilePage() {
  const user = await verifySession();

  return (
    <main className="w-full flex-1 min-h-0 overflow-y-auto bg-slate-100 pt-6 pb-6 shadow-2xl relative">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl sm:w-[calc(100%-3rem)]">
        <ProfileEditor initialUser={user} />
      </div>
    </main>
  );
}

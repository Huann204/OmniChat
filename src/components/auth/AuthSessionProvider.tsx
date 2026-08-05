import { getCurrentShopId } from "@/lib/session";
import { getMyShops, getUser } from "@/lib/dal";
import { AuthStoreProvider } from "@/store/auth-store-provider";

export async function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, shops, currentShopId] = await Promise.all([
    getUser(),
    getMyShops(),
    getCurrentShopId(),
  ]);

  return (
    <AuthStoreProvider
      initialUser={user}
      initialShops={shops}
      initialCurrentShopId={currentShopId ?? null}
    >
      {children}
    </AuthStoreProvider>
  );
}

import { getUser } from "@/lib/dal";
import { AuthStoreProvider } from "@/store/auth-store-provider";

export async function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return <AuthStoreProvider initialUser={user}>{children}</AuthStoreProvider>;
}

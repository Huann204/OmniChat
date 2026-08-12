import { createStore } from "zustand/vanilla";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isSupportAdmin?: boolean;
}

export interface AuthShop {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  shops: AuthShop[];
  currentShopId: string | null;
  setShops: (shops: AuthShop[]) => void;
  setCurrentShopId: (id: string | null) => void;
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export function createAuthStore(
  initialUser: AuthUser | null = null,
  initialShops: AuthShop[] = [],
  initialCurrentShopId: string | null = null
) {
  return createStore<AuthState>((set) => ({
    user: initialUser,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
    shops: initialShops,
    currentShopId: initialCurrentShopId,
    setShops: (shops) => set({ shops }),
    setCurrentShopId: (id) => set({ currentShopId: id }),
  }));
}

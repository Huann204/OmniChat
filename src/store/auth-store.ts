import { createStore } from "zustand/vanilla";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export function createAuthStore(initialUser: AuthUser | null = null) {
  return createStore<AuthState>((set) => ({
    user: initialUser,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
  }));
}

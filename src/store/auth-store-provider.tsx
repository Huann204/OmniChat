"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  type AuthState,
  type AuthStoreApi,
  type AuthUser,
  createAuthStore,
} from "./auth-store";

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export function AuthStoreProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: ReactNode;
}) {
  // Tạo store mới cho mỗi lần mount (mỗi request/response cycle trên server,
  // và giữ nguyên qua các lần re-render phía client) — KHÔNG dùng store
  // singleton ở module scope, vì trên server điều đó sẽ làm rò rỉ dữ liệu
  // của user này sang request của user khác. Dùng useState (lazy initializer)
  // thay vì useRef vì giá trị này CẦN dùng trong lúc render — ref chỉ dành
  // cho giá trị không phục vụ việc render.
  const [store] = useState<AuthStoreApi>(() => createAuthStore(initialUser));

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("useAuthStore phải được dùng bên trong AuthStoreProvider");
  }
  return useStore(store, selector);
}

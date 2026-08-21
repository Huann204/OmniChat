import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  // Có 2 field dưới đây (thông báo tin nhắn mới, xem InboxView) thì Toaster
  // hiện avatar tròn thay icon variant, và cả card bấm được (điều hướng tới
  // đúng hội thoại) thay vì chỉ đọc.
  avatarUrl?: string;
  onClick?: () => void;
  isMessage?: boolean;
}

type ToastInput =
  | string
  | {
      title?: string;
      description?: string;
      duration?: number;
      avatarUrl?: string;
      onClick?: () => void;
      isMessage?: boolean;
    };

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

function normalize(input: ToastInput) {
  return typeof input === "string" ? { title: input } : input;
}

function show(variant: ToastVariant) {
  return (input: ToastInput) =>
    useToastStore
      .getState()
      .add({ duration: 4000, ...normalize(input), variant });
}

export const toast = Object.assign(show("default"), {
  success: show("success"),
  error: show("error"),
  warning: show("warning"),
  info: show("info"),
  dismiss: (id: string) => useToastStore.getState().remove(id),
});

export { useToastStore };

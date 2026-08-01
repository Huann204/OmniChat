"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastItem, type ToastVariant } from "@/store/toast-store";

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const ICON_STYLES: Record<ToastVariant, string> = {
  default: "text-slate-500",
  info: "text-primary",
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
};

const BORDER_STYLES: Record<ToastVariant, string> = {
  default: "border-slate-200/60",
  info: "border-primary/30",
  success: "border-emerald-200",
  error: "border-red-200",
  warning: "border-amber-200",
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((state) => state.remove);
  const Icon = ICONS[toast.variant];

  React.useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => remove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, remove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white/90 backdrop-blur-xl p-4 shadow-[0_20px_40px_-15px_rgba(8,102,255,0.15)]",
        BORDER_STYLES[toast.variant]
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_STYLES[toast.variant])} />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        )}
        {toast.description && (
          <p className="mt-0.5 text-sm text-slate-600">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => remove(toast.id)}
        aria-label="Đóng thông báo"
        className="shrink-0 cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:left-auto sm:right-4 sm:top-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

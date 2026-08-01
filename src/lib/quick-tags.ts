import type { ConversationTagId } from "@/types/conversation";

export const QUICK_TAGS: { id: ConversationTagId; label: string; className: string }[] = [
  { id: "checking", label: "Kiểm hàng", className: "bg-slate-400 hover:bg-slate-500" },
  { id: "question", label: "Câu hỏi", className: "bg-violet-400 hover:bg-violet-500" },
  { id: "purchase", label: "Mua hàng", className: "bg-indigo-400 hover:bg-indigo-500" },
  { id: "shipped", label: "Đã gửi", className: "bg-emerald-500 hover:bg-emerald-600" },
  { id: "out_of_stock", label: "Hết hàng", className: "bg-sky-400 hover:bg-sky-500" },
  { id: "returned", label: "Trả hàng", className: "bg-rose-400 hover:bg-rose-500" },
];

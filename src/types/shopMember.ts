export type ShopRole = "owner" | "admin" | "member";

export interface ShopMember {
  id: string;
  role: ShopRole;
  // Giới hạn Page member này xử lý trong Livechat — CHỈ có ý nghĩa khi
  // role="member" (owner/admin luôn thấy hết). Rỗng = không giới hạn.
  allowedPages: string[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

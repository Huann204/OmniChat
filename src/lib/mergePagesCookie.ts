"use client";

// Cookie tạm (KHÔNG httpOnly — ghi thẳng từ trình duyệt, không qua Server
// Action) chỉ mang danh sách id Page muốn xem gộp khi vào /livechat. Không
// phải dữ liệu nhạy cảm (chỉ là id Page của chính Shop, đã hiện sẵn trên
// Dashboard) nên không cần httpOnly — đổi lại được cái lợi lớn: ghi cookie
// bằng document.cookie là tức thời (không qua mạng), tránh phải vòng qua 1
// Server Action (ghi cookie + redirect) trước khi router.push thật sự chạy —
// cách cũ khiến MỌI lượt vào Livechat tốn thêm 1 round-trip thừa, đo được rõ
// trên production (xem log request lúc debug). Đọc lại ở server qua
// getMergePagesCookie() trong lib/dal.ts, y hệt trước đây.
const MERGE_PAGES_COOKIE = "merge_pages";
const MERGE_PAGES_MAX_AGE = 60 * 60 * 24; // 1 ngày — đủ để thoát ra rồi quay lại /livechat trong ngày mà không phải gộp lại.

export function setMergePagesCookie(pageIds: string[]) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MERGE_PAGES_COOKIE}=${encodeURIComponent(pageIds.join(","))}; path=/livechat; max-age=${MERGE_PAGES_MAX_AGE}; SameSite=Lax${secure}`;
}

"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { AiAssistantSettings, AiReplyPreset, SuggestReplyTrigger } from "@/types/aiAssistant";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export interface UpdateAiAssistantSettingsInput {
  suggestReplyEnabled?: boolean;
  suggestReplyTrigger?: SuggestReplyTrigger;
  presets?: AiReplyPreset[];
}

export async function updateAiAssistantSettings(
  input: UpdateAiAssistantSettingsInput
): Promise<{ settings: AiAssistantSettings } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; settings: AiAssistantSettings }>(
      "/ai-assistant/settings",
      { method: "PUT", headers: await authHeaders(token), body: JSON.stringify(input) }
    );
    return { settings: data.settings };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không lưu được cấu hình AI" };
  }
}

// Sinh 3 gợi ý trả lời cho 1 hội thoại — gọi khi mở hội thoại (hoặc mỗi tin
// mới, tuỳ suggestReplyTrigger) từ InboxView. Lỗi (vd chưa cấu hình
// GEMINI_API_KEY) trả về mảng rỗng thay vì throw — chỉ là gợi ý, không phải
// luồng chính, không nên chặn/làm phiền người dùng.
export async function generateAiSuggestions(
  conversationId: string
): Promise<{ suggestions: string[] } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; suggestions: string[] }>(
      "/ai-assistant/suggestions",
      {
        method: "POST",
        headers: await authHeaders(token),
        body: JSON.stringify({ conversationId }),
      }
    );
    return { suggestions: data.suggestions };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không tạo được gợi ý từ AI" };
  }
}

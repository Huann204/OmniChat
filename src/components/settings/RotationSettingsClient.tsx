"use client";

import * as React from "react";
import { BsArrowRepeat, BsCheck2, BsInfoCircleFill } from "react-icons/bs";
import { saveRotationSettings, type RotationSettings } from "@/app/actions/rotation";
import { MemberAvatar } from "@/components/inbox/AssigneePicker";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import type { ShopMember, ShopRole } from "@/types/shopMember";

const ROLE_LABELS: Record<ShopRole, string> = {
  owner: "Chủ Shop",
  admin: "Quản trị viên",
  member: "Nhân viên",
};

interface RotationSettingsClientProps {
  initialSettings: RotationSettings;
  members: ShopMember[];
  myRole: ShopRole | null;
}

// Cấu hình tự chia hội thoại cho nhân viên theo vòng xoay — xem
// server/src/services/conversationAssignment.service.ts. Chỉ chủ/quản trị
// viên được sửa (server cũng chặn), nhân viên thường chỉ thấy thông báo.
export function RotationSettingsClient({ initialSettings, members, myRole }: RotationSettingsClientProps) {
  const [saved, setSaved] = React.useState(initialSettings);
  const [enabled, setEnabled] = React.useState(initialSettings.enabled);
  const [selected, setSelected] = React.useState<Set<string>>(new Set(initialSettings.userIds));
  const [saving, setSaving] = React.useState(false);

  const canEdit = myRole === "owner" || myRole === "admin";

  const dirty =
    enabled !== saved.enabled ||
    selected.size !== saved.userIds.length ||
    saved.userIds.some((id) => !selected.has(id));

  function toggleMember(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleSave() {
    if (enabled && selected.size === 0) {
      toast.error("Hãy chọn ít nhất 1 nhân viên tham gia xoay vòng");
      return;
    }
    setSaving(true);
    const result = await saveRotationSettings({ enabled, userIds: Array.from(selected) });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSaved(result.settings);
    setEnabled(result.settings.enabled);
    setSelected(new Set(result.settings.userIds));
    toast.success(result.settings.enabled ? "Đã lưu — hội thoại mới sẽ được chia tự động" : "Đã lưu — tắt chia tự động");
  }

  if (!canEdit) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Chế độ xoay vòng</h1>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-sm text-slate-500 shadow-[8px]">
          Chỉ chủ Shop hoặc quản trị viên mới cấu hình được chế độ xoay vòng.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Chế độ xoay vòng</h1>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
        <div className="flex items-start gap-4 p-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BsArrowRepeat className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Tự động chia hội thoại cho nhân viên</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Khi khách nhắn tới mà hội thoại chưa có ai phụ trách, hệ thống tự giao lần lượt cho từng nhân viên
              được chọn bên dưới để khách được chia đều.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Bật/tắt chia hội thoại tự động" />
        </div>

        <div className={cn("p-5 transition-opacity", !enabled && "opacity-50")}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Nhân viên tham gia xoay vòng</p>
            <p className="text-xs text-slate-400">Đã chọn {selected.size}/{members.length}</p>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-slate-400">Shop chưa có nhân viên nào.</p>
          ) : (
            <ul className="space-y-1.5">
              {members.map((m) => {
                const checked = selected.has(m.user.id);
                const limited = m.role === "member" && m.allowedPages.length > 0;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggleMember(m.user.id)}
                      disabled={!enabled}
                      role="checkbox"
                      aria-checked={checked}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer disabled:cursor-not-allowed",
                        checked ? "border-primary/40 bg-primary/5" : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                          checked ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                        )}
                      >
                        {checked && <BsCheck2 className="h-3.5 w-3.5" />}
                      </span>
                      <MemberAvatar member={m.user} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{m.user.name}</span>
                        <span className="block truncate text-xs text-slate-400">{m.user.email}</span>
                      </span>
                      {limited && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Giới hạn {m.allowedPages.length} Page
                        </span>
                      )}
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {ROLE_LABELS[m.role]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex gap-3 bg-slate-50/60 p-5 text-xs leading-relaxed text-slate-500">
          <BsInfoCircleFill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <ul className="list-disc space-y-1 pl-4">
            <li>Chỉ chia hội thoại 1-1, không chia nhóm chat.</li>
            <li>
              Nhân viên bị giới hạn Page chỉ nhận hội thoại của đúng Page mình được phép — không bao giờ bị chia khách
              của Page khác.
            </li>
            <li>
              Chia lần lượt theo thứ tự, <strong>không xét nhân viên đang online hay offline</strong> — nên chỉ chọn
              người đang trực.
            </li>
            <li>Hội thoại đã có người phụ trách không bị chia lại. Có thể đổi người phụ trách bất cứ lúc nào trong khung chat.</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => void handleSave()} disabled={!dirty || saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

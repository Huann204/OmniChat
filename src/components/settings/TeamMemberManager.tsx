"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  addShopMember,
  changeShopMemberRole,
  removeShopMember,
} from "@/app/actions/shopMember";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";
import type { ShopMember, ShopRole } from "@/types/shopMember";

const ROLE_LABELS: Record<ShopRole, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Nhân viên",
};

interface TeamMemberManagerProps {
  initialMembers: ShopMember[];
  // null nếu không xác định được (vd lỗi mạng lúc tải trang) — ẩn hết thao
  // tác quản trị cho an toàn, chỉ hiện danh sách xem được.
  myRole: ShopRole | null;
  // Id của chính mình — dùng để ẩn nút "Xoá" trên đúng dòng của mình, khớp
  // guard "không tự xoá chính mình" ở server/src/controllers/shop.controller.ts#removeMember.
  myUserId: string;
  // Danh sách Page đã kết nối của Shop — dùng làm bộ chọn "chỉ được xử lý
  // Page nào" khi vai trò là "member".
  connectedPages: Bot[];
}

// Quản lý nhân viên (thành viên) của Shop — dùng thật (lưu MongoDB, xem
// server/src/controllers/shop.controller.ts). v1 chỉ thêm được người ĐÃ có
// tài khoản sẵn (nhập email đã đăng ký) — chưa có luồng mời qua email cho
// người chưa từng đăng ký.
export function TeamMemberManager({
  initialMembers,
  myRole,
  myUserId,
  connectedPages,
}: TeamMemberManagerProps) {
  const router = useRouter();
  const [members, setMembers] = React.useState<ShopMember[]>(initialMembers);
  const [modalOpen, setModalOpen] = React.useState(false);
  // null = đang thêm mới, có giá trị = đang sửa đúng member đó.
  const [editingMember, setEditingMember] = React.useState<ShopMember | null>(null);
  const [emailInput, setEmailInput] = React.useState("");
  const [roleInput, setRoleInput] = React.useState<ShopRole>("member");
  const [allowedPagesInput, setAllowedPagesInput] = React.useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);
  // requireShopRole("owner","admin") mới thêm/xoá được, requireShopRole("owner")
  // mới sửa vai trò/giới hạn Page được — khớp server/src/routes/shop.routes.ts.
  const canManage = myRole === "owner" || myRole === "admin";
  const canEdit = myRole === "owner";

  function openAddModal() {
    setEditingMember(null);
    setEmailInput("");
    setRoleInput("member");
    setAllowedPagesInput(new Set());
    setModalOpen(true);
  }

  function openEditModal(member: ShopMember) {
    setEditingMember(member);
    setEmailInput(member.user.email);
    setRoleInput(member.role);
    setAllowedPagesInput(new Set(member.allowedPages));
    setModalOpen(true);
  }

  function toggleAllowedPage(pageId: string) {
    setAllowedPagesInput((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    // Rỗng = không giới hạn (thấy hết) — chỉ gửi lên khi THẬT SỰ đã chọn ít
    // nhất 1 Page, tránh vô tình khoá hết quyền chỉ vì chưa bấm chọn gì.
    const allowedPages =
      roleInput === "member" && allowedPagesInput.size > 0 ? Array.from(allowedPagesInput) : [];

    setIsSaving(true);
    try {
      if (editingMember) {
        const result = await changeShopMemberRole(editingMember.id, roleInput, allowedPages);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? { ...m, role: result.member.role, allowedPages: result.member.allowedPages }
              : m
          )
        );
        toast.success("Đã cập nhật");
        // Vừa chuyển quyền sở hữu cho người khác — chính mình bị hạ xuống
        // Quản trị viên ở server (xem changeMemberRole), nhưng myRole ở đây
        // là prop tĩnh từ lúc tải trang, không tự cập nhật. Refresh lại để
        // canManage/canEdit không còn hiện sai là vẫn đang là chủ sở hữu.
        if (result.member.role === "owner") {
          router.refresh();
        }
      } else {
        const email = emailInput.trim();
        if (!email) return;
        const result = await addShopMember(email, roleInput, allowedPages);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setMembers((prev) => [...prev, result.member]);
        toast.success("Đã thêm nhân viên");
      }
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(memberId: string) {
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));

    const result = await removeShopMember(memberId);
    if (result.error) {
      toast.error(result.error);
      setMembers(previous);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Phân quyền</h1>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Thành viên có tài khoản trong hệ thống mới thêm được — nhập đúng email họ đã đăng ký.
            Vai trò &quot;Nhân viên&quot; có thể giới hạn chỉ xử lý 1 số Page cụ thể trong Livechat.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={openAddModal}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">Chưa có thành viên nào.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{member.user.name}</p>
                  <p className="truncate text-xs text-slate-400">{member.user.email}</p>
                  {member.role === "member" && member.allowedPages.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-primary">
                      Chỉ xử lý {member.allowedPages.length} Page được chọn
                    </p>
                  )}
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {ROLE_LABELS[member.role]}
                </span>

                {canEdit && member.user.id !== myUserId && (
                  <button
                    type="button"
                    aria-label="Sửa thành viên"
                    onClick={() => openEditModal(member)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {canManage && member.user.id !== myUserId && (
                  <button
                    type="button"
                    aria-label="Xoá thành viên"
                    onClick={() => handleRemove(member.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? "Sửa nhân viên" : "Thêm nhân viên"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email (đã có tài khoản trong hệ thống)
            </label>
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="vd: nhanvien@gmail.com"
              autoFocus={!editingMember}
              disabled={!!editingMember}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Vai trò</label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as ShopRole)}
              className="flex h-10 w-full cursor-pointer rounded-xl border border-slate-200/60 bg-white/50 px-4 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {/* Shop chỉ có đúng 1 chủ sở hữu (server chặn thêm mới với vai
                  trò này) — chọn "Chủ sở hữu" chỉ có ý nghĩa lúc SỬA, tức
                  CHUYỂN quyền sở hữu cho người này, không phải thêm mới. */}
              {(editingMember
                ? (Object.keys(ROLE_LABELS) as ShopRole[])
                : (["admin", "member"] as ShopRole[])
              ).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            {editingMember && roleInput === "owner" && editingMember.role !== "owner" && (
              <p className="mt-1.5 text-xs font-medium text-amber-600">
                Bạn sẽ chuyển quyền sở hữu Shop cho người này — chính bạn sẽ bị hạ xuống Quản trị
                viên ngay sau khi lưu.
              </p>
            )}
          </div>

          {roleInput === "member" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Page được xử lý
              </label>
              <p className="mb-2 text-xs text-slate-400">
                Không chọn gì = không giới hạn, thấy hết mọi Page (giống Quản trị viên).
              </p>
              {connectedPages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                  Shop chưa kết nối Page nào.
                </p>
              ) : (
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {connectedPages.map((page) => (
                    <label
                      key={page.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={allowedPagesInput.has(page.id)}
                        onChange={() => toggleAllowedPage(page.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                      />
                      <span className="truncate">{page.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={(!editingMember && !emailInput.trim()) || isSaving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {editingMember ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

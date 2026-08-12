"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { BsCameraFill, BsPersonFill } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  changePassword,
  updateProfile,
  type PasswordFormState,
  type ProfileFormState,
} from "@/app/actions/profile";
import { toast } from "@/store/toast-store";
import type { SessionUser } from "@/lib/dal";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

export function ProfileEditor({ initialUser }: { initialUser: SessionUser }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = React.useState(initialUser.avatarUrl);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profileState, profileAction, profilePending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, {});
  const [passwordState, passwordAction, passwordPending] = useActionState<
    PasswordFormState,
    FormData
  >(changePassword, {});
  const passwordFormRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (profileState.success) {
      toast.success("Đã cập nhật hồ sơ");
      router.refresh();
    } else if (profileState.error) {
      toast.error(profileState.error);
    }
  }, [profileState, router]);

  React.useEffect(() => {
    if (passwordState.success) {
      toast.success("Đã đổi mật khẩu — các thiết bị khác đã đăng xuất");
      passwordFormRef.current?.reset();
    } else if (passwordState.error) {
      toast.error(passwordState.error);
    }
  }, [passwordState]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chọn được file ảnh");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Ảnh tối đa 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "Đổi ảnh đại diện thất bại");
        return;
      }
      setAvatarUrl(data.user.avatarUrl);
      toast.success("Đã đổi ảnh đại diện");
      router.refresh();
    } finally {
      setAvatarUploading(false);
    }
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (newPassword !== confirmPassword) {
      e.preventDefault();
      toast.error("Mật khẩu mới nhập lại không khớp");
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-xl font-semibold text-slate-900">Hồ sơ của tôi</h1>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Thông tin cá nhân</h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-bold text-slate-500">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" />
              ) : (
                <BsPersonFill className="h-7 w-7" />
              )}
            </span>
            <button
              type="button"
              aria-label="Đổi ảnh đại diện"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {avatarUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BsCameraFill className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{initialUser.name}</p>
            <p className="truncate text-xs text-slate-400">{initialUser.email}</p>
          </div>
        </div>

        <form action={profileAction} className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tên hiển thị
            </label>
            <Input name="name" defaultValue={initialUser.name} required maxLength={100} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <Input value={initialUser.email} disabled />
            <p className="mt-1 text-xs text-slate-400">Chưa hỗ trợ đổi email.</p>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profilePending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profilePending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[8px]">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Đổi mật khẩu</h2>
        <p className="mb-4 text-xs text-slate-400">
          Đổi xong sẽ đăng xuất khỏi mọi thiết bị khác, chỉ giữ phiên đang dùng.
        </p>

        <form
          ref={passwordFormRef}
          action={passwordAction}
          onSubmit={handlePasswordSubmit}
          className="flex flex-col gap-3"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mật khẩu hiện tại
            </label>
            <Input name="currentPassword" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mật khẩu mới
            </label>
            <Input
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nhập lại mật khẩu mới
            </label>
            <Input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

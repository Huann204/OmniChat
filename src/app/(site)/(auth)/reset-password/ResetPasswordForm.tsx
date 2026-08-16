'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Lock, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { resetPassword, type ResetPasswordState } from '@/app/actions/auth';
import { toast } from '@/store/toast-store';

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    if (state?.success) {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      const timer = setTimeout(() => {
        router.push('/login');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  if (!token) {
    return (
      <div className="w-full animate-fade-in text-center">
        <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Link không hợp lệ</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Link đặt lại mật khẩu thiếu hoặc không đúng. Vui lòng yêu cầu link mới.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
        >
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Đặt lại mật khẩu</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        {state?.error && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-600 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs sm:text-sm font-semibold text-slate-700">Mật khẩu mới</Label>
          <div className="relative flex items-center group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 6 ký tự"
              className="pl-10 pr-10 h-11 bg-slate-50/60 border-slate-200/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold text-slate-700">Nhập lại mật khẩu</Label>
          <div className="relative flex items-center group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              className={`pl-10 pr-10 h-11 bg-slate-50/60 border-slate-200/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all ${!passwordsMatch ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-red-500 font-medium pt-0.5">Mật khẩu nhập lại không khớp</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={pending || !passwordsMatch}
          className="w-full mt-2 group h-11 text-sm font-semibold shadow-md shadow-primary/20 rounded-xl"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span>Đặt lại mật khẩu</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

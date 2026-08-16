'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { login, type AuthFormState } from '@/app/actions/auth';
import { toast } from '@/store/toast-store';

const initialState: AuthFormState = {};

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đăng nhập thành công!');
      // router.push (chuyển trang mềm, không reload) thay vì
      // window.location.href — server action đã revalidatePath("/","layout")
      // nên layout/dashboard tự lấy session mới, không cần load lại cả trang.
      router.push(state.redirectTo ?? '/dashboard');
    }
  }, [state?.success, state?.redirectTo, router]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full animate-fade-in">
      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 bg-slate-100/90 p-1 rounded-2xl mb-7 border border-slate-200/60 shadow-inner">
        <Link
          href="/login"
          className="py-2.5 text-center text-xs sm:text-sm font-semibold rounded-xl bg-white text-slate-900 shadow-sm transition-all duration-200"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="py-2.5 text-center text-xs sm:text-sm font-medium rounded-xl text-slate-500 hover:text-slate-900 transition-all duration-200"
        >
          Đăng ký
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Chào mừng quay lại</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Nhập thông tin tài khoản của bạn để tiếp tục.</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-600 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700">Email</Label>
          <div className="relative flex items-center group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all"
              defaultValue={state?.email}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-700">Mật khẩu</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-hover font-medium transition-colors hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative flex items-center group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 bg-slate-50/60 border-slate-200/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all"
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

        <Button
          type="submit"
          disabled={pending}
          className="w-full mt-2 group h-11 text-sm font-semibold shadow-md shadow-primary/20 rounded-xl"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 font-medium">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { register, type AuthFormState } from '@/app/actions/auth';
import { toast } from '@/store/toast-store';

const initialState: AuthFormState = {};

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(register, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10 || /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score === 1) return { score: 1, label: 'Yếu', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, label: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    if (state?.success) {
      toast.success('Đăng ký tài khoản thành công!');
      // router.push (chuyển trang mềm) thay vì window.location.href — cùng
      // lý do như LoginForm.tsx.
      router.push('/dashboard');
    }
  }, [state?.success, router]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full animate-fade-in">
      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 bg-slate-100/90 p-1 rounded-2xl mb-6 border border-slate-200/60 shadow-inner">
        <Link
          href="/login"
          className="py-2.5 text-center text-xs sm:text-sm font-medium rounded-xl text-slate-500 hover:text-slate-900 transition-all duration-200"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="py-2.5 text-center text-xs sm:text-sm font-semibold rounded-xl bg-white text-slate-900 shadow-sm transition-all duration-200"
        >
          Đăng ký
        </Link>
      </div>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">Bắt đầu quản lý tin nhắn thông minh cùng Hchat.</p>
      </div>

      <form action={formAction} className="space-y-3.5">
        {state?.error && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-600 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-slate-700">Họ và tên</Label>
          <div className="relative flex items-center group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nguyễn Văn A"
              className="pl-10 h-11 bg-slate-50/60 border-slate-200/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl transition-all"
              defaultValue={state?.name}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
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

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-700">Mật khẩu</Label>
          <div className="relative flex items-center group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              id="password"
              name="password"
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

          {password.length > 0 && (
            <div className="pt-1 space-y-1">
              <div className="flex gap-1.5 h-1.5">
                <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'} transition-all duration-300`} />
                <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'} transition-all duration-300`} />
                <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'} transition-all duration-300`} />
              </div>
              <p className="text-xs text-slate-500 flex justify-between">
                <span>Độ mạnh mật khẩu</span>
                <span className="font-semibold text-slate-700">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
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

        {/* Terms Agreement Checkbox */}
        <label className="flex items-start space-x-2.5 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 transition cursor-pointer"
            required
          />
          <span className="text-xs sm:text-sm text-slate-600 leading-tight">
            Tôi đồng ý với{' '}
            <Link href="#" className="text-primary hover:underline font-semibold">Điều khoản</Link>
            {' '}và{' '}
            <Link href="#" className="text-primary hover:underline font-semibold">Bảo mật</Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={pending || !agreed || !passwordsMatch}
          className="w-full mt-2 group h-11 text-sm font-semibold shadow-md shadow-primary/20 rounded-xl"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký tài khoản</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs sm:text-sm text-slate-500 mt-5 font-medium">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}

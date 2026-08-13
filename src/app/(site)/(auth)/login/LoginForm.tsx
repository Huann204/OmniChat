'use client';

import Link from 'next/link';
import { useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { FadeIn } from '@/components/ui/FadeIn';
import { login, type AuthFormState } from '@/app/actions/auth';
import { toast } from '@/store/toast-store';

const initialState: AuthFormState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đăng nhập thành công!');
      const timer = setTimeout(() => {
        window.location.href = state.redirectTo ?? '/dashboard';
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <FadeIn>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Đăng nhập</h2>
        <p className="text-slate-400 mt-1.5 text-sm font-medium">Vui lòng nhập thông tin để tiếp tục.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10"
              defaultValue={state?.email}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link href="#" className="text-xs text-primary hover:underline font-medium transition-colors">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-500 font-medium">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full mt-2 group h-10 text-sm">
          {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="mt-6 mb-5 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-slate-200 after:mt-0.5 after:flex-1 after:border-t after:border-slate-200">
        <p className="mx-4 mb-0 text-center text-xs font-medium text-slate-400">Hoặc tiếp tục với</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full bg-white hover:bg-slate-50 hover:text-slate-900 h-10 border border-slate-200 text-slate-700 text-sm">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </Button>
        <Button variant="outline" className="w-full bg-white hover:bg-slate-50 hover:text-slate-900 h-10 border border-slate-200 text-slate-700 text-sm">
          <FaGithub className="h-4 w-4 mr-2" />
          GitHub
        </Button>
      </div>

      <p className="text-center text-sm text-slate-600 mt-6 font-medium">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Đăng ký
        </Link>
      </p>
    </FadeIn>
  );
}

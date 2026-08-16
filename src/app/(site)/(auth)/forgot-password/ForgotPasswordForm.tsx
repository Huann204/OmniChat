'use client';

import Link from 'next/link';
import { useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset, type RequestPasswordResetState } from '@/app/actions/auth';
import { toast } from '@/store/toast-store';

const initialState: RequestPasswordResetState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quên mật khẩu?</h2>
        <p className="text-slate-500 mt-1 text-xs sm:text-sm">
          Nhập email tài khoản của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
      </div>

      {state?.message ? (
        <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-700 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{state.message}</span>
        </div>
      ) : (
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
                required
              />
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
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <span>Gửi link đặt lại mật khẩu</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-center text-xs sm:text-sm text-slate-500 mt-6 font-medium">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
  description: 'Đặt lại mật khẩu tài khoản Hchat.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

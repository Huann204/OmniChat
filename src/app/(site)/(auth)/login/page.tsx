import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào tài khoản Hchat của bạn.',
};

export default function LoginPage() {
  return <LoginForm />;
}

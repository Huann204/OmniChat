import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản Hchat mới.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}

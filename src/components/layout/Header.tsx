"use client";

import * as React from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store-provider";
import { Menu, X } from "lucide-react";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Sản phẩm", href: "#features" },
    { label: "Tích hợp", href: "#integrations" },
    { label: "Bảng giá", href: "#pricing" },
    { label: "Tài nguyên", href: "#" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm"
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Hchat Logo" className="h-8 w-auto" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">Hchat</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </Link>
              <LogoutButton variant="ghost" size="sm" />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-primary">
                Đăng nhập
              </Link>
              <Link href="/register">
                <Button size="sm">Dùng thử miễn phí</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 shadow-lg flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-base font-medium text-slate-800 p-2 hover:bg-slate-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px bg-slate-200 my-2" />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-base font-medium text-slate-800 p-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user.name}
              </Link>
              <LogoutButton variant="outline" className="w-full" />
            </>
          ) : (
            <>
              <Link href="/login" className="text-base font-medium text-slate-800 p-2 text-center">
                Đăng nhập
              </Link>
              <Link href="/register">
                <Button className="w-full">Dùng thử miễn phí</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

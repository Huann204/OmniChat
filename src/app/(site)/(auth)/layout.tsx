import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 pt-28 pb-12 relative z-10 min-h-screen">
      <div className="w-full max-w-[900px] grid md:grid-cols-2 rounded-[2rem] overflow-hidden glass-card shadow-xl relative border border-white/60 bg-white/40">
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary to-[#00C6FF] text-white relative overflow-hidden">
          {/* Abstract geometric elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">OmniChat</h1>
            <p className="text-white/90 text-base font-medium">Kết nối với thế giới của bạn.</p>
          </div>

          <div className="relative z-10 mt-auto">
            <blockquote className="space-y-4">
              <p className="text-lg font-medium leading-relaxed">
                "Giải pháp tuyệt vời nhất để quản lý tin nhắn đa kênh. Nhanh chóng và liền mạch."
              </p>
              <footer className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-sm font-bold">
                  A
                </div>
                <div>
                  <div className="font-semibold text-sm">Alex Chen</div>
                  <div className="text-white/80 text-xs font-medium">Product Designer</div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center relative bg-white/80">
          {children}
        </div>
      </div>
    </div>
  );
}

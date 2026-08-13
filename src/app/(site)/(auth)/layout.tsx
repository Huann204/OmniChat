import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 relative z-10 min-h-[calc(100vh-80px)]">
      {/* Soft Background Mesh Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[420px] rounded-3xl glass-card shadow-2xl relative border border-white/80 bg-white/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col my-auto transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]">
        {children}
      </div>
    </div>
  );
}

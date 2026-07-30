import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center cursor-pointer justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-[#0866FF] to-[#00C6FF] text-white hover:opacity-90 shadow-[0_8px_20px_-6px_rgba(8,102,255,0.4)] hover:shadow-[0_12px_24px_-6px_rgba(8,102,255,0.6)] hover:-translate-y-0.5": variant === "primary",
            "border-2 border-primary text-primary hover:bg-primary hover:text-white": variant === "outline",
            "hover:bg-slate-100 text-slate-700 hover:text-slate-900": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-6 text-base": size === "md",
            "h-14 px-8 text-lg": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

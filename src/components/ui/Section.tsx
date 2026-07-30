import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  containerClassName?: string;
  hasContainer?: boolean;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, children, containerClassName, hasContainer = true, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("py-16 md:py-24", className)}
        {...props}
      >
        {hasContainer ? (
          <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8", containerClassName)}>
            {children}
          </div>
        ) : (
          children
        )}
      </section>
    );
  }
);
Section.displayName = "Section";

export { Section };

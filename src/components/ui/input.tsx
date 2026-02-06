import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl px-4 py-3 text-base text-foreground transition-all duration-200",
          "placeholder:text-white/25",
          "focus-visible:outline-none focus-visible:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "md:text-sm",
          className,
        )}
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
          WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
          boxShadow: 'var(--glass-highlight)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = 'var(--glass-bg-hover)';
          e.currentTarget.style.borderColor = 'var(--glass-border-focus)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = 'var(--glass-bg)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          props.onBlur?.(e);
        }}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

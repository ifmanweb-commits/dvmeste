"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-primary text-white hover:bg-[var(--primary-hover)] shadow-glass active:scale-[0.98]",
  accent:
    "bg-accent text-foreground hover:bg-[var(--accent-hover)] shadow-glass active:scale-[0.98]",
  outline:
    "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
  ghost: "text-foreground hover:bg-neutral-light/50",
};

const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-sm rounded-button",
  md: "px-5 py-2.5 text-base rounded-button",
  lg: "px-6 py-3 text-lg rounded-button",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      type = "button",
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled ?? isLoading}
        className={cn(
          "inline-flex items-center justify-center font-display font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "accent" | "primary" | "neutral" | "level";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
                                                                    
  level?: 1 | 2 | 3;
}

const variantStyles: Record<BadgeVariant, string> = {
  accent:
    "bg-accent text-foreground font-semibold shadow-sm",
  primary: "bg-primary/12 text-primary font-semibold",
  neutral: "bg-neutral-light text-neutral-dark",
  level: "bg-accent text-foreground font-display font-bold",
};

export function Badge({
  variant = "accent",
  level,
  className,
  children,
  ...props
}: BadgeProps) {
  const content = variant === "level" && level != null ? `Level ${level}` : children;
  return (
    <span
      role={variant === "level" ? "status" : undefined}
      className={cn(
        "inline-flex items-center rounded-button px-2.5 py-0.5 text-sm transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {content}
    </span>
  );
}

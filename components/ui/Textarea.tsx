// components/ui/textarea.tsx
"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends HTMLAttributes<HTMLTextAreaElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles: Record<NonNullable<TextareaProps["padding"]>, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ glass = true, padding = "md", className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-card border border-neutral-light/80 bg-white/70 text-sm text-foreground shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          glass && "backdrop-blur-md shadow-glass",
          paddingStyles[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
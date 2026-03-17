// components/ui/label.tsx
"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends HTMLAttributes<HTMLLabelElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles: Record<NonNullable<LabelProps["padding"]>, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "flex flex-col gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
          glass && "backdrop-blur-md shadow-glass",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";
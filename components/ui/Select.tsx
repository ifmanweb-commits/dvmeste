// components/ui/select.tsx
"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

// --- SelectContent ---
export interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-full overflow-hidden rounded-card border border-neutral-light/80 bg-white/70 shadow-lg backdrop-blur-md",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SelectContent.displayName = "SelectContent";

// --- SelectItem ---
export interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="option"
        tabIndex={0}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-neutral-light/20 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SelectItem.displayName = "SelectItem";

// --- SelectTrigger ---
export interface SelectTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-card border border-neutral-light/80 bg-white/70 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          glass && "backdrop-blur-md shadow-glass hover:bg-white/80 transition-colors",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

// --- SelectValue ---
export interface SelectValueProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const SelectValue = forwardRef<HTMLDivElement, SelectValueProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 text-left truncate",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SelectValue.displayName = "SelectValue";

// --- Select (Контейнер) ---
// Теперь он просто оборачивает триггер и контент, не управляя состоянием сам
export interface SelectProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ glass = true, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Select.displayName = "Select";
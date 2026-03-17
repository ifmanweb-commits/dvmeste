"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Типы для пропсов компонента Switch
interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Добавляем свойство checked, если нужно управлять им извне (хотя input type="checkbox" обычно самодостаточен)
  // Но для консистентности с другими UI-библиотеками часто добавляют этот пропс.
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <div className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
        {/* 
          Логика состояния:
          - Если checked (или state="checked"), фон становится зеленым (primary).
          - Иначе фон серый/белый (input).
        */}
        <div
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0", // Сдвиг кружка вправо при включении
            className
          )}
        />
        
        {/* 
          Сам input type="checkbox". Он скрыт визуально, но обрабатывает логику.
          Мы передаем все пропсы сюда, чтобы React мог управлять состоянием.
        */}
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
// components/ui/ProfileFields.tsx
import { cn } from "@/lib/utils"

interface FieldProps {
  label: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export const Input = ({ label, error, className, ...props }: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className={cn(
        "w-full p-2 border rounded-lg outline-none transition-all",
        "focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600",
        error ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300",
        props.disabled && "bg-gray-50 cursor-not-allowed opacity-70",
        className
      )}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

export const Select = ({ label, error, children, className, ...props }: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      {...props}
      className={cn(
        "w-full p-2 border border-gray-200 rounded-lg outline-none bg-white",
        error && "border-red-500 bg-red-50",
        props.disabled && "bg-gray-50 opacity-70",
        className
      )}
    >
      {children}
    </select>
  </div>
)
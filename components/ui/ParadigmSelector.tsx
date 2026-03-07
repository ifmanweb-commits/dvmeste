// components/ui/ParadigmSelector.tsx
'use client'

import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParadigmSelectorProps {
  label: string
  selected: string[]
  options: string[]
  onChange: (items: string[]) => void
  error?: string
}

export function ParadigmSelector({ label, selected, options, onChange, error }: ParadigmSelectorProps) {
  const toggleItem = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item))
    } else {
      onChange([...selected, item])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Список выбранных */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map(item => (
          <span 
            key={item} 
            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
          >
            {item}
            <button 
              type="button" 
              onClick={() => toggleItem(item)}
              className="ml-2 hover:text-blue-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Выпадающий список или сетка вариантов */}
      <div className="border rounded-lg p-3 bg-gray-50/50 max-h-48 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {options.map(option => {
            const isSelected = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleItem(option)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs transition-colors border",
                  isSelected 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
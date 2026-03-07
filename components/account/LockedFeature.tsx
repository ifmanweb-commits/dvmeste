// components/account/LockedFeature.tsx
import { Lock } from "lucide-react"

export function LockedFeature({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mt-2">
        {description}
      </p>
      <button 
        type="button"
        className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        onClick={() => window.location.href = '/account/certification'}
      >
        Как подтвердить квалификацию? →
      </button>
    </div>
  )
}
// components/account/DocumentCard.tsx
'use client'

import { FileText, Trash2, CheckCircle, Clock, Search } from "lucide-react"
import { Document } from "@prisma/client"
import { Input } from "@/components/ui/ProfileFields"


interface DocumentCardProps {
  doc: Partial<Document>
  onUpdate: (data: Partial<Document>) => void
  onDelete: () => void
}

export function DocumentCard({ doc, onUpdate, onDelete }: DocumentCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4 mb-4">
        <div 
          className="relative w-20 h-20 flex-shrink-0 group cursor-pointer overflow-hidden rounded-lg border border-gray-100"
          onClick={() => window.open(doc.url, '_blank')}
        >
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <Search className="w-5 h-5 text-white" />
          </div>
          <img 
            src={doc.url} 
            alt={doc.filename} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {doc.filename}
          </p>
          <div className="mt-1">
            {doc.verifiedAt ? (
              <span className="flex items-center text-xs text-green-600 font-medium">
                <CheckCircle className="w-3 h-3 mr-1" /> Проверено
              </span>
            ) : (
              <span className="flex items-center text-xs text-amber-600 font-medium">
                <Clock className="w-3 h-3 mr-1" /> На проверке
              </span>
            )}
          </div>
        </div>
        
        <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-4 border-t pt-4">
        <Input 
          label="Организация / ВУЗ"
          placeholder="Напр: МГУ им. Ломоносова"
          value={doc.organization || ''}
          onChange={(e) => onUpdate({ ...doc, organization: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input 
            label="Год выпуска" 
            type="number"
            placeholder="2015"
            value={doc.year?.toString() || ''}
            onChange={(e) => onUpdate({ ...doc, year: parseInt(e.target.value) || 0 })}
          />
          <Input 
            label="Программа" 
            placeholder="Психология"
            value={doc.programName || ''}
            onChange={(e) => onUpdate({ ...doc, programName: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
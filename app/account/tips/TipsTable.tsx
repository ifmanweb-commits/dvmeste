"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface TipHistoryItem {
  id: string
  title: string
  message: string
  type: "TOAST" | "MODAL"
  pageUrl: string
  delaySeconds: number
  dismissedAt: Date
}

export default function TipsTable({ tips }: { tips: TipHistoryItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Текст
            </th>
            <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Страница
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tips.map((tip) => (
            <TipRow key={tip.id} tip={tip} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TipRow({ tip }: { tip: TipHistoryItem }) {
  const isLong = tip.message.length > 200

  const formatDate = (dateString: Date): string => {
    return dateString.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatDate(tip.dismissedAt)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
        <ExpandableText text={tip.message} isLong={isLong} />
      </td>
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-right">
        <Link
          href={tip.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[#5858E2] hover:text-[#4a4ac4] transition-colors"
          title={`Перейти на ${tip.pageUrl}`}
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  )
}

function ExpandableText({ text, isLong }: { text: string; isLong: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const displayText = isLong && !expanded ? text.slice(0, 200) + "..." : text

  return (
    <div>
      <p className="whitespace-pre-wrap">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm text-[#5858E2] hover:text-[#4a4ac4] font-medium transition-colors"
        >
          {expanded ? "Свернуть" : "Читать далее"}
        </button>
      )}
    </div>
  )
}
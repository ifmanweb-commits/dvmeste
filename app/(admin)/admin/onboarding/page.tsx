"use client"

import { useState, useEffect } from "react"
import { getTips, createTip, updateTip, deleteTip, getTipById } from "@/lib/actions/onboarding"
import { TipType } from "@prisma/client"
import { Pencil, Trash2, Eye, Plus, Copy, X } from "lucide-react"
import { cn, normalizeUrl } from "@/lib/utils"
import { OnboardingToast } from "@/components/account/OnboardingToast"
import { OnboardingModal } from "@/components/account/OnboardingModal"

interface Tip {
  id: string
  title: string
  message: string
  type: TipType
  pageUrl: string
  delaySeconds: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type TabType = "toasts" | "modals"

export default function OnboardingPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("toasts")
  const [urlFilter, setUrlFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingTip, setEditingTip] = useState<Tip | null>(null)
  const [previewQueue, setPreviewQueue] = useState<Tip[]>([])
  const [modalPreviewQueue, setModalPreviewQueue] = useState<Tip[]>([])
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    pageUrl: "",
    delaySeconds: 0,
    isActive: true,
  })
  const [normalizedPreview, setNormalizedPreview] = useState<string>("")

  const loadTips = async () => {
    setLoading(true)
    const result = await getTips({
      type: activeTab === "toasts" ? TipType.TOAST : TipType.MODAL,
      pageUrl: urlFilter || undefined,
    })
    if (result.success) {
      setTips(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTips()
  }, [activeTab, urlFilter])

  const handleOpenForm = (tip?: Tip) => {
    if (tip) {
      setEditingTip(tip)
      setFormData({
        title: tip.title,
        message: tip.message,
        pageUrl: tip.pageUrl,
        delaySeconds: tip.delaySeconds,
        isActive: tip.isActive,
      })
    } else {
      setEditingTip(null)
      setFormData({
        title: "",
        message: "",
        pageUrl: "",
        delaySeconds: 0,
        isActive: true,
      })
    }
    setShowForm(true)
  }

  const handleUrlChange = (value: string) => {
    setFormData({ ...formData, pageUrl: value })
    setNormalizedPreview(normalizeUrl(value))
  }

  const handleCopyNormalized = () => {
    navigator.clipboard.writeText(normalizedPreview)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.message || !formData.pageUrl) {
      alert("Заполните обязательные поля")
      return
    }

    const result = editingTip
      ? await updateTip(editingTip.id, {
          ...formData,
          type: activeTab === "toasts" ? TipType.TOAST : TipType.MODAL,
        })
      : await createTip({
          ...formData,
          type: activeTab === "toasts" ? TipType.TOAST : TipType.MODAL,
        })

    if (result.success) {
      setShowForm(false)
      loadTips()
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить подсказку?")) return

    const result = await deleteTip(id)
    if (result.success) {
      loadTips()
    } else {
      alert(result.error)
    }
  }

  const handlePreview = (tip: Tip) => {
    // Добавляем в очередь предпросмотра в зависимости от типа
    if (tip.type === TipType.TOAST) {
      setPreviewQueue(prev => [...prev, tip])
    } else {
      setModalPreviewQueue(prev => [...prev, tip])
    }
  }

  const handlePreviewClose = () => {
    // Просто удаляем первый элемент из очереди, без записи в БД
    setPreviewQueue(prev => prev.slice(1))
  }

  const handleModalPreviewClose = () => {
    // Просто удаляем первый элемент из очереди модалок, без записи в БД
    setModalPreviewQueue(prev => prev.slice(1))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Обучающие подсказки
        </h1>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5858E2] hover:bg-[#4a4ac4] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* Вкладки */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("toasts")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "toasts"
              ? "border-[#5858E2] text-[#5858E2]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Тосты
        </button>
        <button
          onClick={() => setActiveTab("modals")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "modals"
              ? "border-[#5858E2] text-[#5858E2]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Окна
        </button>
      </div>

      {/* Фильтр по URL */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Фильтр по URL..."
          value={urlFilter}
          onChange={(e) => setUrlFilter(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
        />
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Загрузка...</div>
      ) : tips.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          {urlFilter ? "Ничего не найдено" : "Подсказок пока нет"}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Заголовок
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  URL
                </th>
                {activeTab === "toasts" && (
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    Задержка (сек)
                  </th>
                )}
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Статус
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tips.map((tip) => (
                <tr key={tip.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">
                      {tip.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-xs">
                    {tip.pageUrl}
                  </td>
                  {activeTab === "toasts" && (
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {tip.delaySeconds}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        tip.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      )}
                    >
                      {tip.isActive ? "Активна" : "Неактивна"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(tip)}
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        title="Предпросмотр"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleOpenForm(tip)}
                        className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tip.id)}
                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingTip ? "Редактировать подсказку" : "Новая подсказка"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  placeholder="Введите заголовок"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Текст *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2] resize-none"
                  placeholder="Введите текст подсказки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL страницы *
                </label>
                <input
                  type="text"
                  value={formData.pageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  placeholder="/account/articles"
                />
                {formData.pageUrl && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Будет сохранён как:
                      </span>
                      <button
                        onClick={handleCopyNormalized}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Копировать"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                    <code className="text-xs text-[#5858E2] font-mono">
                      {normalizedPreview}
                    </code>
                  </div>
                )}
              </div>

              {activeTab === "toasts" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Задержка (сек)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.delaySeconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delaySeconds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5858E2]"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#5858E2] focus:ring-[#5858E2]"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Активна
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 bg-[#5858E2] hover:bg-[#4a4ac4] text-white rounded-lg font-medium transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Предпросмотр тоста - показывает первый в очереди */}
      {previewQueue.length > 0 && (
        <OnboardingToast
          toast={previewQueue[0]}
          onClose={handlePreviewClose}
        />
      )}
      
      {/* Предпросмотр модального окна - показывает первый в очереди */}
      {modalPreviewQueue.length > 0 && (
        <OnboardingModal
          tip={modalPreviewQueue[0]}
          onClose={handleModalPreviewClose}
        />
      )}
    </div>
  )
}
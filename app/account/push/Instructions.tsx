"use client"

import { useState } from "react"
import { Monitor, Smartphone, Apple, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function Instructions() {
  const [activePlatform, setActivePlatform] = useState<string | null>(null)

  const platforms = [
    {
      id: "desktop",
      name: "Десктоп",
      icon: Monitor,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      instructions: [
        "Нажмите кнопку «Включить уведомления»",
        "Разрешите показ уведомлений в диалоге браузера",
        "Готово! Теперь вы будете получать push-уведомления"
      ]
    },
    {
      id: "android",
      name: "Android",
      icon: Smartphone,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      instructions: [
        "Нажмите кнопку «Включить уведомления»",
        "Разрешите показ уведомлений в диалоге браузера",
        "Для надёжности: добавьте сайт на главный экран",
        "Откройте сайт с главного экрана для лучшей работы"
      ]
    },
    {
      id: "ios",
      name: "iOS",
      icon: Apple,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      instructions: [
        "Нажмите кнопку «Включить уведомления»",
        "Разрешите показ уведомлений в диалоге Safari",
        "Нажмите «Поделиться» (квадрат со стрелкой вверх)",
        "Выберите «На экран «Домой»",
        "Откройте сайт с рабочего стола",
        "Разрешите уведомления при первом запуске"
      ]
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Как включить уведомления
      </h3>

      {/* Кнопки выбора платформы */}
      <div className="flex flex-wrap gap-2 mb-4">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isActive = activePlatform === platform.id

          return (
            <button
              key={platform.id}
              onClick={() => setActivePlatform(isActive ? null : platform.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                isActive
                  ? `${platform.bgColor} ${platform.borderColor} ${platform.color}`
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {platform.name}
              {isActive ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )
        })}
      </div>

      {/* Выдвигаемая инструкция */}
      {activePlatform && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {platforms.map((platform) => {
            if (activePlatform !== platform.id) return null

            return (
              <div
                key={platform.id}
                className={cn(
                  "p-4 rounded-lg border",
                  platform.bgColor,
                  platform.borderColor
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <platform.icon className={cn("w-5 h-5", platform.color)} />
                  <h4 className={cn("font-medium", platform.color)}>
                    {platform.name}
                  </h4>
                </div>
                <ol className="space-y-2">
                  {platform.instructions.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium flex-shrink-0",
                        platform.bgColor,
                        platform.color
                      )}>
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      )}

      {!activePlatform && (
        <p className="text-sm text-gray-500">
          Выберите платформу, чтобы увидеть инструкцию
        </p>
      )}
    </div>
  )
}

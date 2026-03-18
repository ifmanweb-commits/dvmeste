import { Monitor, Smartphone, Tablet, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface Subscription {
  id: string
  endpoint: string
  deviceType: string | null
  deviceOs: string | null
  browser: string | null
  createdAt: Date
}

interface ActiveSubscriptionsProps {
  subscriptions: Subscription[]
}

export function ActiveSubscriptions({ subscriptions }: ActiveSubscriptionsProps) {
  if (subscriptions.length === 0) {
    return null
  }

  // Отладка: выводим данные первой подписки в консоль
  if (subscriptions[0]) {
    /*console.log('Subscription data:', {
      browser: subscriptions[0].browser,
      deviceOs: subscriptions[0].deviceOs,
      deviceType: subscriptions[0].deviceType
    })*/
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Активные устройства ({subscriptions.length})
      </h3>
      <div className="space-y-3">
        {subscriptions.map((sub, index) => (
          <div
            key={sub.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <DeviceIcon
                deviceType={sub.deviceType}
                deviceOs={sub.deviceOs}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getDeviceLabel(sub.deviceType, sub.deviceOs, index + 1)}
                </p>
                <p className="text-xs text-gray-500">
                  {getBrowserLabel(sub.browser)} • {formatDate(sub.createdAt)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeviceIcon({
  deviceType,
  deviceOs
}: {
  deviceType: string | null
  deviceOs: string | null
}) {
  // Приоритет: ОС > тип устройства
  const os = deviceOs?.toLowerCase()
  const type = deviceType?.toLowerCase()

  let Icon = Monitor
  let bgColor = "bg-gray-100"
  let iconColor = "text-gray-600"

  // Определяем иконку по ОС
  if (os === 'ios') {
    if (type === 'tablet') {
      Icon = Tablet
    } else {
      Icon = Smartphone
    }
    bgColor = "bg-blue-100"
    iconColor = "text-blue-600"
  } else if (os === 'android') {
    if (type === 'tablet') {
      Icon = Tablet
    } else {
      Icon = Smartphone
    }
    bgColor = "bg-green-100"
    iconColor = "text-green-600"
  } else if (os === 'windows') {
    Icon = Monitor
    bgColor = "bg-blue-100"
    iconColor = "text-blue-600"
  } else if (os === 'macos') {
    Icon = Monitor
    bgColor = "bg-gray-100"
    iconColor = "text-gray-600"
  } else if (os === 'linux') {
    Icon = Globe
    bgColor = "bg-orange-100"
    iconColor = "text-orange-600"
  } else {
    // По типу устройства если ОС не определена
    if (type === 'mobile') {
      Icon = Smartphone
      bgColor = "bg-green-100"
      iconColor = "text-green-600"
    } else if (type === 'tablet') {
      Icon = Tablet
      bgColor = "bg-blue-100"
      iconColor = "text-blue-600"
    } else {
      Icon = Monitor
      bgColor = "bg-gray-100"
      iconColor = "text-gray-600"
    }
  }

  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
      bgColor
    )}>
      <Icon className={cn("w-5 h-5", iconColor)} />
    </div>
  )
}

function getDeviceLabel(
  deviceType: string | null,
  deviceOs: string | null,
  fallbackIndex: number
): string {
  const os = deviceOs?.toLowerCase()
  const type = deviceType?.toLowerCase()

  const osNames: Record<string, string> = {
    windows: 'Windows',
    macos: 'macOS',
    ios: 'iOS',
    android: 'Android',
    linux: 'Linux'
  }

  const typeNames: Record<string, string> = {
    desktop: 'Компьютер',
    mobile: 'Телефон',
    tablet: 'Планшет'
  }

  // Если есть ОС - используем её с типом устройства
  if (os && osNames[os]) {
    const osName = osNames[os]
    if (type && typeNames[type]) {
      return `${osName} • ${typeNames[type]}`
    }
    return osName
  }

  // Если есть только тип устройства
  if (type && typeNames[type]) {
    return typeNames[type]
  }

  return `Устройство ${fallbackIndex}`
}

function getBrowserLabel(browser: string | null): string {
  if (!browser) return 'Браузер не определён'

  const browserLower = browser.toLowerCase()
  
  const browserNames: Record<string, string> = {
    chrome: 'Chrome',
    safari: 'Safari',
    firefox: 'Firefox',
    edge: 'Edge'
  }

  return browserNames[browserLower] || browser.charAt(0).toUpperCase() + browser.slice(1)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(date))
}

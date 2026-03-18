/**
 * Парсинг User-Agent строки для определения устройства, ОС и браузера
 */

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  deviceOs: 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'unknown'
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'other'
  userAgent: string
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()

  // Определение операционной системы
  let deviceOs: DeviceInfo['deviceOs'] = 'unknown'

  if (ua.includes('windows')) {
    deviceOs = 'windows'
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    deviceOs = 'macos'
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    deviceOs = 'ios'
  } else if (ua.includes('android')) {
    deviceOs = 'android'
  } else if (ua.includes('linux')) {
    deviceOs = 'linux'
  }

  // Определение типа устройства
  let deviceType: DeviceInfo['deviceType'] = 'unknown'

  // Сначала проверяем мобильные устройства
  if (ua.includes('mobile')) {
    // Исключаем планшеты из мобильных
    if (ua.includes('ipad') || ua.includes('tablet')) {
      deviceType = 'tablet'
    } else {
      deviceType = 'mobile'
    }
  } else if (ua.includes('ipad') || ua.includes('tablet')) {
    deviceType = 'tablet'
  } else if (ua.includes('iphone') || ua.includes('ipod')) {
    deviceType = 'mobile'
  } else if (ua.includes('android')) {
    // Android без mobile/tablet маркера - скорее всего планшет
    if (ua.includes('mobile')) {
      deviceType = 'mobile'
    } else {
      deviceType = 'tablet'
    }
  } else {
    deviceType = 'desktop'
  }

  // Определение браузера
  let browser: DeviceInfo['browser'] = 'other'

  // Edge должен проверяться перед Chrome (содержит 'Chrome' в UA)
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'edge'
  } else if (ua.includes('firefox')) {
    browser = 'firefox'
  } else if (ua.includes('chrome')) {
    browser = 'chrome'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'safari'
  }

  return {
    deviceType,
    deviceOs,
    browser,
    userAgent
  }
}

/**
 * Форматирование названия ОС для отображения
 */
export function formatOsName(os: string): string {
  const names: Record<string, string> = {
    windows: 'Windows',
    macos: 'macOS',
    ios: 'iOS',
    android: 'Android',
    linux: 'Linux'
  }
  return names[os] || os
}

/**
 * Форматирование названия браузера для отображения
 */
export function formatBrowserName(browser: string): string {
  const names: Record<string, string> = {
    chrome: 'Chrome',
    safari: 'Safari',
    firefox: 'Firefox',
    edge: 'Edge'
  }
  return names[browser] || browser
}

/**
 * Форматирование типа устройства для отображения
 */
export function formatDeviceType(deviceType: string): string {
  const names: Record<string, string> = {
    desktop: 'Компьютер',
    laptop: 'Ноутбук',
    mobile: 'Телефон',
    tablet: 'Планшет'
  }
  return names[deviceType] || 'Устройство'
}

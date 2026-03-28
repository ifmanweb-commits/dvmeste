/**
 * Утилиты для работы с cookies
 */

/**
 * Получает значение куки по имени (на сервере)
 * @param cookieString - строка cookies из заголовка
 * @param name - имя куки
 * @returns значение куки или undefined
 */
export function getCookie(cookieString: string, name: string): string | undefined {
  const value = `; ${cookieString}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop();
    if (cookieValue) {
      return cookieValue.split(';').shift();
    }
  }
  return undefined;
}

/**
 * Получает значение куки по имени (на клиенте)
 * @param name - имя куки
 * @returns значение куки или undefined
 */
export function getCookieClient(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop();
    if (cookieValue) {
      return cookieValue.split(';').shift();
    }
  }
  return undefined;
}

/**
 * Устанавливает куки (на клиенте)
 * @param name - имя куки
 * @param value - значение куки
 * @param options - опции куки
 */
export function setCookieClient(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }

  let cookieString = `${name}=${value}`;

  if (options.maxAge !== undefined) {
    cookieString += `; Max-Age=${options.maxAge}`;
  }

  if (options.path !== undefined) {
    cookieString += `; Path=${options.path}`;
  } else {
    cookieString += `; Path=/`;
  }

  if (options.secure) {
    cookieString += `; Secure`;
  }

  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Удаляет куки (на клиенте)
 * @param name - имя куки
 */
export function deleteCookieClient(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}
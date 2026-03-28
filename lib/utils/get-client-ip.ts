import { headers } from 'next/headers';

/**
 * Получает IP адрес клиента из заголовков запроса
 * @returns IP адрес или null
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers();
    
    // Проверяем стандартные заголовки для получения реального IP
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = headersList.get('x-client-ip');
    
    // x-forwarded-for может содержать несколько IP (через запятую)
    if (forwardedFor) {
      // Берём первый IP из списка (оригинальный клиент)
      const ip = forwardedFor.split(',')[0].trim();
      if (ip) return ip;
    }
    
    if (realIp) return realIp.trim();
    if (clientIp) return clientIp.trim();
    
    // Fallback на стандартный заголовок
    const host = headersList.get('host');
    if (host) {
      // В локальной разработке может быть localhost
      return '127.0.0.1';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return null;
  }
}

/**
 * Получает IP адрес из Request объекта
 * @param request - Request объект
 * @returns IP адрес
 */
export function getClientIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = request.headers.get('x-client-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) return realIp.trim();
  if (clientIp) return clientIp.trim();
  
  return 'unknown';
}
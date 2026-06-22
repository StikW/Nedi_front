/**
 * Origen público del front (enlaces /join/...).
 * En el navegador usa el host actual (tututor.co o www.tututor.co).
 */
export function getPublicAppOrigin(fallback: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return fallback.replace(/\/$/, '');
}

/**
 * Base URL pública de la API (absoluta).
 * En producción: https://tututor.co/api (Nginx → NestJS).
 * En local: http://localhost:3000
 */
export function getPublicApiBaseUrl(apiUrl: string, fallbackOrigin: string): string {
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return apiUrl.replace(/\/$/, '');
  }
  const origin = getPublicAppOrigin(fallbackOrigin);
  const path = apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`;
  return `${origin}${path}`.replace(/\/$/, '');
}

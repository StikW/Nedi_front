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

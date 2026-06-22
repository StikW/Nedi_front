export const environment = {
    production: true,
    /** Mismo origen: funciona en tututor.co y www.tututor.co vía Nginx /api */
    apiUrl: '/api',
    apiVersion: 'v1',
    /** Fallback SSR/build; en el navegador se usa window.location.origin */
    publicAppUrl: 'https://tututor.co',
    metaWebhookUrl: 'https://tututor.co/api/meta/webhook',
  };
import { HttpErrorResponse } from '@angular/common/http';

function messageFromBody(body: unknown): string | null {
  if (!body) return null;
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join(', ');
  }
  return null;
}

/** Extrae el mensaje legible que devuelve la API NestJS (HttpException / ValidationPipe). */
export function extractApiErrorMessage(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    return messageFromBody(error.error) || error.message || null;
  }
  if (error && typeof error === 'object' && 'error' in error) {
    return messageFromBody((error as HttpErrorResponse).error);
  }
  return null;
}

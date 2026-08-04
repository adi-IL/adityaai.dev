/**
 * Never leak upstream/provider error messages to clients.
 */

export function publicErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again later.'): string {
  // Only surface our own short, intentional validation-style messages.
  if (error && typeof error === 'object' && 'publicMessage' in error) {
    const msg = (error as { publicMessage?: unknown }).publicMessage;
    if (typeof msg === 'string' && msg.length > 0 && msg.length < 200) return msg;
  }
  return fallback;
}

export function logError(scope: string, error: unknown): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
  console.error(`[${scope}]`, message);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

export class PublicError extends Error {
  publicMessage: string;
  status: number;

  constructor(publicMessage: string, status = 400) {
    super(publicMessage);
    this.publicMessage = publicMessage;
    this.status = status;
  }
}

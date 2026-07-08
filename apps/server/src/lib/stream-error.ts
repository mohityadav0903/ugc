export function formatStreamError(error: unknown): string {
  if (error == null) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

export function logStreamError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}

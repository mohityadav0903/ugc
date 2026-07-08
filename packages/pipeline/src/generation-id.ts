import { randomUUID } from 'node:crypto';

export function createGenerationId(): string {
  return randomUUID();
}

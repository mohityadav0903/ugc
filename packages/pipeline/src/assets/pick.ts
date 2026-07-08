export function pickRandomIndex(length: number, seed?: string): number {
  if (length <= 1) return 0;
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash % length;
  }
  return Math.floor(Math.random() * length);
}

export function pickRandomItem<T>(items: readonly T[], seed?: string): T | null {
  if (items.length === 0) return null;
  return items[pickRandomIndex(items.length, seed)] ?? null;
}

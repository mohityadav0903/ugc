import type { AssetOption } from './types';

const GENERIC_TOKENS = new Set([
  'reaction',
  'meme',
  'screaming',
  'scream',
  'shrug',
  'lame',
  'confused',
  'funny',
  'viral',
  'the',
  'and',
  'with',
]);

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function queryTokens(query: string): string[] {
  return normalizeText(query)
    .split(' ')
    .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token));
}

export function queryRelevanceScore(query: string, option: AssetOption): number {
  const normalizedQuery = normalizeText(query);
  const haystack = normalizeText(
    [option.title, option.label, option.author, ...(option.tags ?? [])].filter(Boolean).join(' '),
  );

  if (!haystack) return 0;

  let score = 0;

  if (haystack.includes(normalizedQuery)) score += 20;

  const tokens = queryTokens(query);
  if (tokens.length === 0) return score;

  const matched = tokens.filter((token) => haystack.includes(token));
  score += matched.length * 6;

  if (matched.length === tokens.length) score += 8;

  const genericOnly =
    matched.length > 0 &&
    matched.every((token) => GENERIC_TOKENS.has(token) || token.length <= 4);
  if (genericOnly && tokens.length >= 1) score -= 12;

  if (tokens.length >= 2 && matched.length === 1) score -= 6;

  return score;
}

export function sortMemesByRelevance(query: string, options: AssetOption[]): AssetOption[] {
  return [...options].sort((left, right) => {
    const relevanceDiff = queryRelevanceScore(query, right) - queryRelevanceScore(query, left);
    if (relevanceDiff !== 0) return relevanceDiff;
    return 0;
  });
}

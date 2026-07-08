import { AssetLimits } from '../constants/assets';
import { expandMemeSearchQueries } from '../data/meme-catalog';

const MEME_QUERY_SUFFIXES = [' reaction', ' meme reaction'] as const;

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries
    .map((query) => query.trim().slice(0, AssetLimits.giphyQueryMaxChars))
    .filter((query) => {
      const key = query.toLowerCase();
      if (!query || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function buildMemeSearchQueries(query: string): string[] {
  const expanded = expandMemeSearchQueries(query, AssetLimits.giphyQueryMaxChars);
  const withSuffixes = expanded.flatMap((base) => [
    base,
    ...MEME_QUERY_SUFFIXES.map((suffix) => `${base}${suffix}`),
  ]);
  return uniqueQueries(withSuffixes);
}

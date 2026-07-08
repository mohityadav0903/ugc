import { AssetLimits } from '../constants/assets';
import { buildMemeSearchQueries } from './meme-search-queries';
import { queryRelevanceScore } from './meme-relevance';
import { rankMemeCandidates } from './meme-rank';
import { pickRandomIndex } from './pick';
import { type AssetOption, dedupeAssetOptions } from './types';

const KLIPY_BASE = 'https://api.klipy.com/api/v1';

interface KlipyMediaFormat {
  url: string;
  width: number;
  height: number;
}

interface KlipyClip {
  title: string;
  slug: string;
  url: string;
  file: {
    mp4?: string;
    gif?: string;
    webp?: string;
  };
  file_meta?: {
    mp4?: { width: number; height: number };
    gif?: { width: number; height: number };
  };
  tags?: string[];
  blur_preview?: string;
}

interface KlipyGifItem {
  title: string;
  slug: string;
  file: {
    hd?: { mp4?: KlipyMediaFormat; gif?: KlipyMediaFormat };
    md?: { mp4?: KlipyMediaFormat; gif?: KlipyMediaFormat };
    sm?: { gif?: KlipyMediaFormat; webp?: KlipyMediaFormat };
  };
  tags?: string[];
}

interface KlipyPaginatedResponse<T> {
  result?: boolean;
  data?: {
    data?: T[];
  };
}

function portraitScore(width?: number, height?: number): number {
  if (!width || !height) return 1;
  if (height > width * 1.15) return 3;
  if (height >= width) return 2;
  return 0;
}

function httpThumbnail(url?: string): string | undefined {
  if (!url?.startsWith('http')) return undefined;
  return url;
}

async function fetchKlipy<T>(
  apiKey: string,
  endpoint: string,
  params: Record<string, string>,
): Promise<T[]> {
  const url = new URL(`${KLIPY_BASE}/${apiKey}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as KlipyPaginatedResponse<T>;
  return payload.data?.data ?? [];
}

function clipToOption(item: KlipyClip, index: number): AssetOption | null {
  const mp4Url = item.file?.mp4;
  if (!mp4Url) return null;

  const width = item.file_meta?.mp4?.width;
  const height = item.file_meta?.mp4?.height;
  const score = portraitScore(width, height);
  const title = item.title?.trim() || item.slug?.replace(/-/g, ' ');

  return {
    id: `klipy-clip-${index}`,
    label: title || `Clip ${index + 1}`,
    sourceUrl: mp4Url,
    meta: score >= 2 ? 'klipy-clip-portrait' : 'klipy-clip',
    thumbnailUrl: httpThumbnail(item.file?.gif ?? item.file?.webp),
    width,
    height,
    source: 'klipy',
    title,
    tags: item.tags,
    hasAudio: true,
  };
}

function gifToOption(item: KlipyGifItem, index: number): AssetOption | null {
  const mp4 = item.file?.hd?.mp4 ?? item.file?.md?.mp4;
  if (!mp4?.url) return null;

  const score = portraitScore(mp4.width, mp4.height);
  const title = item.title?.trim() || item.slug?.replace(/-/g, ' ');

  return {
    id: `klipy-gif-${index}`,
    label: title || `GIF ${index + 1}`,
    sourceUrl: mp4.url,
    meta: score >= 2 ? 'klipy-gif-mp4-portrait' : 'klipy-gif-mp4',
    thumbnailUrl: httpThumbnail(
      item.file?.sm?.gif?.url ?? item.file?.md?.gif?.url ?? item.file?.hd?.gif?.url,
    ),
    width: mp4.width,
    height: mp4.height,
    source: 'klipy',
    title,
    tags: item.tags,
    hasAudio: false,
  };
}

async function searchKlipyClips(
  apiKey: string,
  query: string,
  page: number,
): Promise<AssetOption[]> {
  const items = await fetchKlipy<KlipyClip>(apiKey, 'clips/search', {
    q: query,
    page: String(page),
    per_page: '24',
    content_filter: 'medium',
    locale: 'en_US',
  });

  return items
    .map((item, index) => clipToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

async function searchKlipyGifs(
  apiKey: string,
  query: string,
  page: number,
): Promise<AssetOption[]> {
  const items = await fetchKlipy<KlipyGifItem>(apiKey, 'gifs/search', {
    q: query,
    page: String(page),
    per_page: '24',
    content_filter: 'medium',
    locale: 'en_US',
    format_filter: 'mp4',
  });

  return items
    .map((item, index) => gifToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

async function listKlipyClipsTrending(apiKey: string, page: number): Promise<AssetOption[]> {
  const items = await fetchKlipy<KlipyClip>(apiKey, 'clips/trending', {
    page: String(page),
    per_page: '24',
    content_filter: 'medium',
    locale: 'en_US',
  });

  return items
    .map((item, index) => clipToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

function rankKlipyCandidates(query: string, options: AssetOption[]): AssetOption[] {
  return [...options].sort((left, right) => {
    const relevanceDiff = queryRelevanceScore(query, right) - queryRelevanceScore(query, left);
    if (relevanceDiff !== 0) return relevanceDiff;
    return rankMemeCandidates([left, right])[0] === left ? -1 : 1;
  });
}

export async function listKlipyCandidates(apiKey: string, query: string): Promise<AssetOption[]> {
  const page = pickRandomIndex(3, query) + 1;
  const queries = buildMemeSearchQueries(query);
  const clips: AssetOption[] = [];
  const gifs: AssetOption[] = [];

  for (const searchQuery of queries) {
    const [clipBatch, gifBatch] = await Promise.all([
      searchKlipyClips(apiKey, searchQuery, page),
      searchKlipyGifs(apiKey, searchQuery, page),
    ]);
    clips.push(...clipBatch);
    gifs.push(...gifBatch);
  }

  let combined = dedupeAssetOptions([...clips, ...gifs]);

  if (combined.length === 0) {
    combined = dedupeAssetOptions(await listKlipyClipsTrending(apiKey, page));
  }

  const bestRelevance = combined.length > 0 ? queryRelevanceScore(query, combined[0]) : 0;
  if (bestRelevance < 6) {
    const gifOnly = dedupeAssetOptions(gifs);
    if (gifOnly.length > 0 && queryRelevanceScore(query, gifOnly[0]) > bestRelevance) {
      combined = gifOnly;
    }
  }

  return rankKlipyCandidates(query, combined)
    .slice(0, 12)
    .map((option, index) => ({ ...option, id: `meme-${index}` }));
}

import { AssetLimits } from '../constants/assets';
import { buildMemeSearchQueries } from './meme-search-queries';
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

interface KlipyMediaItem {
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

function memeToOption(item: KlipyMediaItem, index: number): AssetOption | null {
  const mp4 =
    item.file?.hd?.mp4 ??
    item.file?.md?.mp4;
  if (!mp4?.url) return null;

  const score = portraitScore(mp4.width, mp4.height);
  const title = item.title?.trim() || item.slug?.replace(/-/g, ' ');

  return {
    id: `klipy-meme-${index}`,
    label: title || `Meme ${index + 1}`,
    sourceUrl: mp4.url,
    meta: score >= 2 ? 'klipy-meme-mp4-portrait' : 'klipy-meme-mp4',
    thumbnailUrl: httpThumbnail(
      item.file?.sm?.gif?.url ??
        item.file?.md?.gif?.url ??
        item.file?.hd?.gif?.url,
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

async function searchKlipyMemes(
  apiKey: string,
  query: string,
  page: number,
): Promise<AssetOption[]> {
  const items = await fetchKlipy<KlipyMediaItem>(apiKey, 'memes/search', {
    q: query,
    page: String(page),
    per_page: '24',
    content_filter: 'medium',
    locale: 'en_US',
    format_filter: 'mp4',
  });

  return items
    .map((item, index) => memeToOption(item, index))
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

export async function listKlipyCandidates(apiKey: string, query: string): Promise<AssetOption[]> {
  const page = pickRandomIndex(3, query) + 1;
  const queries = buildMemeSearchQueries(query);
  const clips: AssetOption[] = [];

  for (const searchQuery of queries) {
    const batch = await searchKlipyClips(apiKey, searchQuery, page);
    clips.push(...batch);
    if (clips.length >= 10) break;
  }

  const memes: AssetOption[] = [];
  if (clips.length < 6) {
    for (const searchQuery of queries) {
      const batch = await searchKlipyMemes(apiKey, searchQuery, page);
      memes.push(...batch);
      if (clips.length + memes.length >= 10) break;
    }
  }

  if (clips.length === 0 && memes.length === 0) {
    clips.push(...(await listKlipyClipsTrending(apiKey, page)));
  }

  return rankMemeCandidates(dedupeAssetOptions([...clips, ...memes]))
    .slice(0, 12)
    .map((option, index) => ({ ...option, id: `meme-${index}` }));
}

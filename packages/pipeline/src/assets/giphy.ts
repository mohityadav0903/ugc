import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AssetLimits, GiphyEndpoints } from '../constants/assets';
import { buildMemeSearchQueries } from './meme-search-queries';
import { rankMemeCandidates } from './meme-rank';
import { type AssetOption, dedupeAssetOptions } from './types';
import { pickRandomIndex } from './pick';

interface GiphyClipAsset {
  url?: string;
  width?: number;
  height?: number;
}

interface GiphyImageAsset {
  url?: string;
  mp4?: string;
  width?: string;
  height?: string;
}

interface GiphyUser {
  display_name?: string;
  username?: string;
}

interface GiphyClipItem {
  title?: string;
  slug?: string;
  username?: string;
  user?: GiphyUser;
  rating?: string;
  tags?: string[];
  images?: Record<string, GiphyImageAsset | undefined>;
  video?: {
    assets?: Record<string, GiphyClipAsset | undefined>;
    preview?: string;
  };
}

interface GiphyGifItem {
  title?: string;
  slug?: string;
  username?: string;
  user?: GiphyUser;
  tags?: string[];
  images?: Record<string, GiphyImageAsset | undefined>;
}

interface GiphyClipsSearchResponse {
  data: GiphyClipItem[];
}

interface GiphyGifSearchResponse {
  data: GiphyGifItem[];
}

export type GiphyClipsStatus = 'available' | 'forbidden' | 'unknown';

let clipsApiStatus: GiphyClipsStatus = 'unknown';

export function getGiphyClipsStatus(): GiphyClipsStatus {
  return clipsApiStatus;
}

export function getGiphyClipsStatusNote(): string | undefined {
  if (clipsApiStatus === 'forbidden') {
    return 'Giphy Clips API requires separate approval (email clips@giphy.com). Using GIF video fallbacks without meme audio.';
  }
  return undefined;
}

function pickClipAsset(item: GiphyClipItem): GiphyClipAsset | null {
  const assets = item.video?.assets;
  if (!assets) return null;

  const preferred = ['720p', '480p', '360p', 'source'];
  for (const key of preferred) {
    const asset = assets[key];
    if (asset?.url) return asset;
  }

  return Object.values(assets).find((asset) => asset?.url) ?? null;
}

function pickGifMp4(item: GiphyGifItem): { url: string; width?: number; height?: number } | null {
  const mp4Asset = item.images?.original_mp4 ?? item.images?.downsized_mp4;
  const url = mp4Asset?.mp4;
  if (!url) return null;

  return {
    url,
    width: mp4Asset?.width ? Number(mp4Asset.width) : undefined,
    height: mp4Asset?.height ? Number(mp4Asset.height) : undefined,
  };
}

function pickThumbnail(item: GiphyClipItem | GiphyGifItem): string | undefined {
  return (
    ('video' in item ? item.video?.preview : undefined) ??
    item.images?.fixed_width_still?.url ??
    item.images?.downsized_still?.url ??
    item.images?.original_still?.url
  );
}

function portraitScore(width?: number, height?: number): number {
  if (!width || !height) return 1;
  if (height > width * 1.15) return 3;
  if (height >= width) return 2;
  return 0;
}

function clipToOption(item: GiphyClipItem, index: number): AssetOption | null {
  const asset = pickClipAsset(item);
  if (!asset?.url) return null;

  const score = portraitScore(asset.width, asset.height);
  const title = item.title?.trim() || item.slug?.replace(/-/g, ' ');

  return {
    id: `clip-${index}`,
    label: title || `Clip ${index + 1}`,
    sourceUrl: asset.url,
    meta: score >= 2 ? 'giphy-clip-portrait' : 'giphy-clip',
    thumbnailUrl: pickThumbnail(item),
    width: asset.width,
    height: asset.height,
    source: 'giphy',
    title,
    author: item.user?.display_name ?? item.username,
    tags: item.tags,
    hasAudio: true,
  };
}

function gifToOption(item: GiphyGifItem, index: number): AssetOption | null {
  const mp4 = pickGifMp4(item);
  if (!mp4) return null;

  const score = portraitScore(mp4.width, mp4.height);
  const title = item.title?.trim() || item.slug?.replace(/-/g, ' ');

  return {
    id: `gif-${index}`,
    label: title || `GIF ${index + 1}`,
    sourceUrl: mp4.url,
    meta: score >= 2 ? 'giphy-gif-mp4-portrait' : 'giphy-gif-mp4',
    thumbnailUrl: pickThumbnail(item),
    width: mp4.width,
    height: mp4.height,
    source: 'giphy',
    title,
    author: item.user?.display_name ?? item.username,
    tags: item.tags,
    hasAudio: false,
  };
}

async function fetchGiphyClips(
  endpoint: string,
  apiKey: string,
  params: Record<string, string>,
): Promise<GiphyClipItem[]> {
  if (clipsApiStatus === 'forbidden') return [];

  const url = new URL(endpoint);
  url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });

  if (response.status === 403) {
    clipsApiStatus = 'forbidden';
    return [];
  }

  if (!response.ok) return [];

  clipsApiStatus = 'available';
  const payload = (await response.json()) as GiphyClipsSearchResponse;
  return payload.data ?? [];
}

async function searchGiphyClips(apiKey: string, query: string, offset: number): Promise<AssetOption[]> {
  const items = await fetchGiphyClips(GiphyEndpoints.clipsSearch, apiKey, {
    q: query,
    limit: String(AssetLimits.giphyLimit),
    offset: String(offset),
    rating: 'pg-13',
    lang: 'en',
  });

  return items
    .map((item, index) => clipToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

async function listGiphyClipsTrending(apiKey: string, offset: number): Promise<AssetOption[]> {
  const items = await fetchGiphyClips(GiphyEndpoints.clipsTrending, apiKey, {
    limit: String(AssetLimits.giphyLimit),
    offset: String(offset),
    rating: 'pg-13',
  });

  return items
    .map((item, index) => clipToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

async function searchGiphyGifMp4(apiKey: string, query: string, offset: number): Promise<AssetOption[]> {
  const url = new URL(GiphyEndpoints.search);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(AssetLimits.giphyLimit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('rating', 'pg-13');
  url.searchParams.set('lang', 'en');

  const response = await fetch(url, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as GiphyGifSearchResponse;
  return payload.data
    .map((item, index) => gifToOption(item, index))
    .filter((option): option is AssetOption => option !== null);
}

export async function listGiphyCandidates(apiKey: string, query: string): Promise<AssetOption[]> {
  const offset = pickRandomIndex(AssetLimits.giphyMaxOffset, query);
  const queries = buildMemeSearchQueries(query);
  const clips: AssetOption[] = [];

  for (const searchQuery of queries) {
    const batch = await searchGiphyClips(apiKey, searchQuery, offset);
    clips.push(...batch);
    if (clips.length >= 10) break;
  }

  if (clips.length === 0 && clipsApiStatus !== 'forbidden') {
    const trending = await listGiphyClipsTrending(apiKey, offset);
    clips.push(...trending);
  }

  if (clips.length >= 6) {
    return rankMemeCandidates(dedupeAssetOptions(clips))
      .slice(0, 12)
      .map((option, index) => ({ ...option, id: `meme-${index}` }));
  }

  const gifs: AssetOption[] = [];
  for (const searchQuery of queries) {
    const batch = await searchGiphyGifMp4(apiKey, searchQuery, offset);
    gifs.push(...batch);
  }

  const combined = rankMemeCandidates(dedupeAssetOptions([...clips, ...gifs]));
  return combined.slice(0, 12).map((option, index) => ({ ...option, id: `meme-${index}` }));
}

export async function downloadAssetFromUrl(sourceUrl: string, targetPath: string): Promise<string> {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Asset download failed with status ${response.status}`);
  }
  await mkdir(join(targetPath, '..'), { recursive: true });
  await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  return targetPath;
}

export async function downloadGiphyAsset(
  apiKey: string,
  query: string,
  workDir: string,
): Promise<string> {
  const candidates = await listGiphyCandidates(apiKey, query);
  const picked = candidates[0];
  if (!picked) throw new Error('No Giphy meme found');

  const targetPath = join(workDir, 'overlay.mp4');
  await downloadAssetFromUrl(picked.sourceUrl, targetPath);
  return targetPath;
}

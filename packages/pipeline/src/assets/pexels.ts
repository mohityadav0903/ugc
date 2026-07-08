import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AssetLimits, PexelsEndpoints } from '../constants/assets';
import { type AssetOption, dedupeAssetOptions } from './types';
import { pickRandomIndex } from './pick';

interface PexelsVideoFile {
  link: string;
  width: number;
  height: number;
  quality?: string;
}

interface PexelsVideoPicture {
  picture: string;
}

interface PexelsUser {
  name: string;
}

interface PexelsVideo {
  id: number;
  url?: string;
  duration?: number;
  width?: number;
  height?: number;
  image?: string;
  tags?: string[];
  user?: PexelsUser;
  video_pictures?: PexelsVideoPicture[];
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
}

const BACKGROUND_SUFFIXES = [
  ' aesthetic interior',
  ' modern apartment interior',
  ' luxury living room',
] as const;

const MEME_SUFFIXES = [' reaction', ' funny reaction', ' talking head'] as const;

interface PexelsSearchOptions {
  meta: string;
  labelPrefix: string;
  minDuration?: number;
  size?: 'small' | 'medium' | 'large';
}

function pickBestVideoFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  const portraitMp4 = files.filter(
    (file) => file.link.endsWith('.mp4') && file.height >= file.width,
  );
  const mp4Files = portraitMp4.length > 0 ? portraitMp4 : files.filter((file) => file.link.endsWith('.mp4'));
  if (mp4Files.length === 0) return null;
  return mp4Files.sort((a, b) => b.height - a.height)[0] ?? null;
}

function titleFromPexelsUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/\/video\/([^/]+)-\d+\/?$/);
  if (!match?.[1]) return undefined;
  return match[1].replace(/-/g, ' ');
}

function pickThumbnail(video: PexelsVideo): string | undefined {
  return video.video_pictures?.[0]?.picture ?? video.image;
}

function trimSearchQuery(query: string, maxChars: number): string {
  return query.trim().slice(0, maxChars);
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries
    .map((query) => trimSearchQuery(query, AssetLimits.pexelsQueryMaxChars))
    .filter((query) => {
      if (!query || seen.has(query)) return false;
      seen.add(query);
      return true;
    });
}

function buildBackgroundQueries(query: string): string[] {
  const base = trimSearchQuery(query, AssetLimits.pexelsQueryMaxChars);
  return uniqueQueries([base, ...BACKGROUND_SUFFIXES.map((suffix) => `${base}${suffix}`)]);
}

function buildMemeQueries(query: string): string[] {
  const base = trimSearchQuery(query, AssetLimits.pexelsQueryMaxChars);
  return uniqueQueries([`${base} reaction`, base, ...MEME_SUFFIXES.map((suffix) => `${base}${suffix}`)]);
}

function toPexelsOption(
  video: PexelsVideo,
  file: PexelsVideoFile,
  options: PexelsSearchOptions,
  index: number,
): AssetOption {
  const isPortrait = file.height > file.width * 1.1;
  const title = titleFromPexelsUrl(video.url);
  return {
    id: `${options.meta}-${index}`,
    label: title ? `${options.labelPrefix}: ${title}` : `${options.labelPrefix} ${file.width}x${file.height}`,
    sourceUrl: file.link,
    meta: isPortrait ? `${options.meta}-portrait` : options.meta,
    thumbnailUrl: pickThumbnail(video),
    durationSec: video.duration,
    width: file.width,
    height: file.height,
    source: 'pexels',
    title,
    author: video.user?.name,
    tags: video.tags?.length ? video.tags : undefined,
  };
}

async function searchPexelsVideos(
  apiKey: string,
  query: string,
  options: PexelsSearchOptions,
  varietySeed?: string,
): Promise<AssetOption[]> {
  const url = new URL(PexelsEndpoints.searchVideos);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(AssetLimits.pexelsPerPage));
  url.searchParams.set(
    'page',
    String(1 + pickRandomIndex(AssetLimits.pexelsMaxPage, varietySeed)),
  );
  url.searchParams.set('orientation', 'portrait');
  if (options.minDuration) {
    url.searchParams.set('min_duration', String(options.minDuration));
  }
  if (options.size) {
    url.searchParams.set('size', options.size);
  }

  const response = await fetch(url, {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Pexels request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as PexelsSearchResponse;
  const optionsOut: AssetOption[] = [];
  for (const [index, video] of payload.videos.entries()) {
    const file = pickBestVideoFile(video.video_files);
    if (!file) continue;
    optionsOut.push(toPexelsOption(video, file, options, index));
  }
  return optionsOut;
}

export async function listPexelsCandidates(apiKey: string, query: string): Promise<AssetOption[]> {
  const queries = buildBackgroundQueries(query);
  let candidates: AssetOption[] = [];

  for (const searchQuery of queries) {
    candidates = await searchPexelsVideos(
      apiKey,
      searchQuery,
      {
        meta: 'pexels-bg',
        labelPrefix: 'Interior video',
        minDuration: 5,
        size: 'medium',
      },
      query,
    );
    if (candidates.length > 0) break;
  }

  return dedupeAssetOptions(candidates)
    .slice(0, 10)
    .map((option, index) => ({ ...option, id: `bg-${index}` }));
}

export async function listPexelsMemeCandidates(apiKey: string, query: string): Promise<AssetOption[]> {
  const queries = buildMemeQueries(query);
  const all: AssetOption[] = [];

  for (const searchQuery of queries) {
    const batch = await searchPexelsVideos(
      apiKey,
      searchQuery,
      {
        meta: 'pexels-meme',
        labelPrefix: 'Reaction clip',
        minDuration: 2,
        size: 'small',
      },
      query,
    );
    all.push(...batch);
    if (all.length >= 8) break;
  }

  return dedupeAssetOptions(all)
    .slice(0, 8)
    .map((option, index) => ({ ...option, id: `pex-meme-${index}` }));
}

export async function downloadPexelsBackground(
  apiKey: string,
  query: string,
  workDir: string,
): Promise<string> {
  const candidates = await listPexelsCandidates(apiKey, query);
  const picked = candidates[0];
  if (!picked) throw new Error('No Pexels background video found');

  await mkdir(workDir, { recursive: true });
  const targetPath = join(workDir, 'background.mp4');
  const response = await fetch(picked.sourceUrl, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Pexels download failed with status ${response.status}`);
  }
  await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  return targetPath;
}

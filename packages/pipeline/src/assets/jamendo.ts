import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AssetLimits, JamendoEndpoints } from '../constants/assets';
import { type AssetOption, dedupeAssetOptions } from './types';
import { pickRandomIndex } from './pick';

interface JamendoTrack {
  id: string;
  name: string;
  audiodownload: string;
  audiodownload_allowed?: boolean;
  duration: number;
}

interface JamendoTracksResponse {
  results: JamendoTrack[];
}

interface JamendoSearchStrategy {
  tags: string;
  search?: string;
  instrumentalOnly?: boolean;
}

const PresetJamendoTags: Record<string, string> = {
  hype: 'electronic+hiphop',
  chill: 'lounge+chillout',
  dramatic: 'cinematic+soundtrack',
};

const PresetJamendoFallbackTags: Record<string, string[]> = {
  hype: ['hiphop', 'electronic', 'dance'],
  chill: ['chillout', 'lounge', 'ambient'],
  dramatic: ['cinematic', 'soundtrack', 'epic'],
};

function buildJamendoSearchStrategies(
  presetId: string,
  audioSearch?: string,
): JamendoSearchStrategy[] {
  const primaryTags = PresetJamendoTags[presetId] ?? PresetJamendoTags.chill;
  const fallbackTags = PresetJamendoFallbackTags[presetId] ?? ['electronic'];
  const search = audioSearch?.trim().slice(0, 40);

  const strategies: JamendoSearchStrategy[] = [
    ...(search ? [{ tags: primaryTags, search, instrumentalOnly: true }] : []),
    { tags: primaryTags, instrumentalOnly: true },
    ...fallbackTags.map((tags) => ({ tags, instrumentalOnly: true })),
  ];

  const seen = new Set<string>();
  return strategies.filter((strategy) => {
    const key = `${strategy.tags}|${strategy.search ?? ''}|${strategy.instrumentalOnly ?? false}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isDownloadableTrack(track: JamendoTrack): boolean {
  if (!track.audiodownload?.startsWith('http')) return false;
  if (track.audiodownload_allowed === false) return false;
  return true;
}

async function fetchJamendoCandidates(
  clientId: string,
  strategy: JamendoSearchStrategy,
  varietySeed?: string,
): Promise<JamendoTrack[]> {
  const offsets = [0, pickRandomIndex(AssetLimits.jamendoMaxOffset, varietySeed)];

  for (const offset of offsets) {
    const url = new URL(JamendoEndpoints.tracks);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(AssetLimits.jamendoLimit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('audioformat', 'mp32');
    url.searchParams.set('audiodlformat', 'mp32');
    url.searchParams.set('durationbetween', '12_180');
    url.searchParams.set('include', 'musicinfo');
    url.searchParams.set('tags', strategy.tags);

    if (strategy.search) {
      url.searchParams.set('search', strategy.search);
    }

    if (strategy.instrumentalOnly !== false) {
      url.searchParams.set('vocalinstrumental', 'instrumental');
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Jamendo request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as JamendoTracksResponse;
    const candidates = (payload.results ?? []).filter(isDownloadableTrack);
    if (candidates.length > 0) return candidates;
  }

  return [];
}

export async function listJamendoCandidates(
  clientId: string,
  presetId: string,
  audioSearch?: string,
): Promise<AssetOption[]> {
  const strategies = buildJamendoSearchStrategies(presetId, audioSearch);
  const all: AssetOption[] = [];

  for (const strategy of strategies) {
    const tracks = await fetchJamendoCandidates(clientId, strategy, audioSearch);
    for (const track of tracks) {
      all.push({
        id: `audio-${track.id}`,
        label: track.name,
        sourceUrl: track.audiodownload,
        meta: `${Math.round(track.duration)}s`,
        durationSec: Math.round(track.duration),
        source: 'jamendo',
        title: track.name,
      });
    }
    if (all.length >= 8) break;
  }

  return dedupeAssetOptions(all).slice(0, 10);
}

export async function downloadJamendoFromUrl(sourceUrl: string, workDir: string): Promise<string> {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Jamendo download failed with status ${response.status}`);
  }

  await mkdir(workDir, { recursive: true });
  const targetPath = join(workDir, 'audio.mp3');
  await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
  return targetPath;
}

import type { SearchAssetsInput, SearchAssetsResult } from '@ugc/types';
import { getGiphyClipsStatusNote, listGiphyCandidates } from '../assets/giphy';
import { listKlipyCandidates } from '../assets/klipy';
import { listJamendoCandidates } from '../assets/jamendo';
import { rankMemeCandidates } from '../assets/meme-rank';
import { listPexelsCandidates, listPexelsMemeCandidates } from '../assets/pexels';
import { dedupeAssetOptions } from '../assets/types';
import type { PipelineToolContext } from './context';
import { toToolFailure } from './context';

async function listMemeCandidates(ctx: PipelineToolContext, gifQuery: string) {
  const batches = [];

  if (ctx.config.klipyApiKey) {
    batches.push(await listKlipyCandidates(ctx.config.klipyApiKey, gifQuery));
  }

  batches.push(await listGiphyCandidates(ctx.config.giphyApiKey, gifQuery));

  const merged = rankMemeCandidates(dedupeAssetOptions(batches.flat()));
  if (merged.length > 0) {
    return merged.slice(0, 12).map((option, index) => ({ ...option, id: `meme-${index}` }));
  }

  const pexels = await listPexelsMemeCandidates(ctx.config.pexelsApiKey, gifQuery);
  return rankMemeCandidates(dedupeAssetOptions(pexels))
    .slice(0, 12)
    .map((option, index) => ({ ...option, id: `meme-${index}` }));
}

function buildMemeSearchNote(ctx: PipelineToolContext): string | undefined {
  const notes = [
    ctx.config.klipyApiKey ? undefined : 'Add KLIPY_API_KEY for meme clips with audio (klipy.com/developers).',
    getGiphyClipsStatusNote(),
  ].filter(Boolean);

  return notes.length > 0 ? notes.join(' ') : undefined;
}

export async function runSearchAssets(
  ctx: PipelineToolContext,
  input: SearchAssetsInput,
): Promise<SearchAssetsResult> {
  try {
    const [memes, backgrounds, audio] = await Promise.all([
      listMemeCandidates(ctx, input.gifQuery),
      listPexelsCandidates(ctx.config.pexelsApiKey, input.backgroundQuery),
      ctx.config.jamendoClientId
        ? listJamendoCandidates(
            ctx.config.jamendoClientId,
            input.audioPresetId,
            input.audioSearch.trim() || undefined,
          )
        : Promise.resolve([]),
    ]);

    if (memes.length === 0) {
      return { ok: false, error: 'No meme clips found — try a different influencer or meme name' };
    }
    if (backgrounds.length === 0) {
      return { ok: false, error: 'No background videos found on Pexels' };
    }
    if (audio.length === 0) {
      return { ok: false, error: 'No audio candidates found on Jamendo' };
    }

    return { ok: true, memes, backgrounds, audio, memeSearchNote: buildMemeSearchNote(ctx) };
  } catch (error) {
    return toToolFailure(error);
  }
}

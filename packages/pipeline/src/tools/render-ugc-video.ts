import type { RenderUgcVideoInput, RenderUgcVideoResult } from '@ugc/types';
import {
  buildPublicVideoUrl,
  cleanupWorkDir,
  composeVideo,
  downloadSelectedAssets,
} from '../compose';
import type { PipelineToolContext } from './context';
import { toToolFailure } from './context';

export async function runRenderUgcVideo(
  ctx: PipelineToolContext,
  input: RenderUgcVideoInput,
): Promise<RenderUgcVideoResult> {
  const sourceUrl = input.sourceUrl?.trim() || undefined;
  const assets = await downloadSelectedAssets(ctx.config, {
    layout: input.layout,
    memeSourceUrl: input.memeSourceUrl,
    backgroundSourceUrl: input.backgroundSourceUrl.trim() || undefined,
    audioSourceUrl: input.audioSourceUrl,
  });

  try {
    const { videoId } = await composeVideo(
      ctx.config,
      { hook: input.hook, subtext: input.subtext },
      assets,
    );
    const videoUrl = buildPublicVideoUrl(ctx.config, videoId);

    return {
      ok: true,
      videoUrl,
      hook: input.hook,
      vibe: input.vibe,
      sourceUrl,
      trace: {
        resolvedUrl: sourceUrl,
        productImageUrl: null,
        scrapeStatus: sourceUrl ? 'ok' : 'skipped',
      },
    };
  } catch (error) {
    return toToolFailure(error);
  } finally {
    await cleanupWorkDir(assets.workDir);
  }
}

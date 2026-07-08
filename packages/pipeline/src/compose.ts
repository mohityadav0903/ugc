import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ServerConfig, VideoLayout } from '@ugc/types';
import { PublicPaths, VideoSpec } from '@ugc/types';
import { BackgroundFx, ComposeTimeouts, GifOverlay } from './constants/compose';
import { downloadAssetFromUrl } from './assets/giphy';
import {
  buildOverlayTextFilters,
  prepareOverlayHookLines,
  prepareOverlaySubtextLines,
} from './overlay-text';
import { loadAudioPresets } from './assets/audio';

export interface VideoCopy {
  hook: string;
  subtext: string;
}

export interface SelectedAssetUrls {
  layout: VideoLayout;
  memeSourceUrl: string;
  backgroundSourceUrl?: string;
  audioSourceUrl: string;
}

export interface ResolvedAssets {
  layout: VideoLayout;
  backgroundPath?: string;
  gifPath: string;
  audioPath: string;
}

export interface AssetBundle extends ResolvedAssets {
  workDir: string;
}

async function runFfmpeg(config: ServerConfig, args: string[]): Promise<void> {
  const process = Bun.spawn([config.ffmpegPath, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const timeout = setTimeout(() => {
    process.kill();
  }, ComposeTimeouts.ffmpegMs);

  const exitCode = await process.exited;
  clearTimeout(timeout);

  if (exitCode !== 0) {
    const stderr = await new Response(process.stderr).text();
    throw new Error(`ffmpeg failed (${exitCode}): ${stderr.slice(-500)}`);
  }
}

function ffprobePath(ffmpegPath: string): string {
  return ffmpegPath.replace(/ffmpeg([^/]*)$/, 'ffprobe$1');
}

async function probeHasAudio(ffmpegPath: string, filePath: string): Promise<boolean> {
  const probe = ffprobePath(ffmpegPath);
  const process = Bun.spawn(
    [
      probe,
      '-v',
      'error',
      '-select_streams',
      'a',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'csv=p=0',
      filePath,
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );

  const stdout = await new Response(process.stdout).text();
  const exitCode = await process.exited;
  return exitCode === 0 && stdout.trim().length > 0;
}

function buildAudioFilter(
  durationSec: number,
  overlayHasAudio: boolean,
  overlayInputIndex: number,
  musicInputIndex: number,
): string {
  const fadeOutStart = durationSec - 0.35;
  const musicFilter = `[${musicInputIndex}:a]aloop=loop=-1:size=2e+09,atrim=0:${durationSec},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.25,afade=t=out:st=${fadeOutStart}:d=0.35`;

  if (!overlayHasAudio) {
    return `${musicFilter},loudnorm=I=-14:TP=-1:LRA=11[aout]`;
  }

  const memeVolume = 1;
  const musicVolume = 0.28;
  return `[${overlayInputIndex}:a]atrim=0:${durationSec},asetpts=PTS-STARTPTS,volume=${memeVolume}[va];${musicFilter},volume=${musicVolume}[ma];[va][ma]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-14:TP=-1:LRA=11[aout]`;
}

function buildLayeredVideoFilter(copy: VideoCopy): string {
  const { width, height, durationSec } = VideoSpec;
  const hookLines = prepareOverlayHookLines(copy.hook);
  const subtextLines = prepareOverlaySubtextLines(copy.subtext);
  const duration = String(durationSec);

  const bgFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},trim=0:${duration},setpts=PTS-STARTPTS,eq=brightness=${BackgroundFx.brightness}:saturation=${BackgroundFx.saturation}[bg]`;
  const overlayFilter = `[1:v]scale=${GifOverlay.width}:-1,setpts=PTS-STARTPTS[overlay]`;
  const overlayComposite = `[bg][overlay]overlay=(W-w)/2:(H-h)/2:format=auto:eof_action=repeat[withOverlay]`;

  const { filter: textFilters } = buildOverlayTextFilters('withOverlay', hookLines, subtextLines);

  return [bgFilter, overlayFilter, overlayComposite, textFilters].filter(Boolean).join(';');
}

function buildFullBleedVideoFilter(copy: VideoCopy): string {
  const { width, height, durationSec } = VideoSpec;
  const hookLines = prepareOverlayHookLines(copy.hook);
  const subtextLines = prepareOverlaySubtextLines(copy.subtext);
  const duration = String(durationSec);

  const baseFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},trim=0:${duration},setpts=PTS-STARTPTS[base]`;
  const { filter: textFilters } = buildOverlayTextFilters('base', hookLines, subtextLines);

  return [baseFilter, textFilters].filter(Boolean).join(';');
}

export async function downloadSelectedAssets(
  config: ServerConfig,
  urls: SelectedAssetUrls,
): Promise<AssetBundle> {
  const workDir = join(config.videosDir, 'work', randomUUID());
  await mkdir(workDir, { recursive: true });

  const [gifPath, audioPath] = await Promise.all([
    downloadAssetFromUrl(urls.memeSourceUrl, join(workDir, 'overlay.mp4')),
    downloadAssetFromUrl(urls.audioSourceUrl, join(workDir, 'audio.mp3')),
  ]);

  if (urls.layout === 'layered') {
    if (!urls.backgroundSourceUrl?.trim()) {
      throw new Error('backgroundSourceUrl is required when layout is layered');
    }

    const backgroundPath = await downloadAssetFromUrl(
      urls.backgroundSourceUrl,
      join(workDir, 'background.mp4'),
    );

    return { workDir, layout: urls.layout, backgroundPath, gifPath, audioPath };
  }

  return { workDir, layout: urls.layout, gifPath, audioPath };
}

export async function composeVideo(
  config: ServerConfig,
  copy: VideoCopy,
  assets: ResolvedAssets,
): Promise<{ outputPath: string; videoId: string }> {
  await mkdir(config.videosDir, { recursive: true });

  const videoId = randomUUID();
  const outputPath = join(config.videosDir, `${videoId}.${VideoSpec.extension}`);
  const { durationSec, fps } = VideoSpec;

  const overlayHasAudio = await probeHasAudio(config.ffmpegPath, assets.gifPath);

  if (assets.layout === 'full_bleed') {
    const filter = buildFullBleedVideoFilter(copy);
    const audioFilter = buildAudioFilter(durationSec, overlayHasAudio, 0, 1);

    const args = [
      '-y',
      '-stream_loop',
      '-1',
      '-i',
      assets.gifPath,
      '-i',
      assets.audioPath,
      '-filter_complex',
      `${filter};${audioFilter}`,
      '-map',
      '[vout]',
      '-map',
      '[aout]',
      '-t',
      String(durationSec),
      '-r',
      String(fps),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      outputPath,
    ];

    await runFfmpeg(config, args);
    return { outputPath, videoId };
  }

  if (!assets.backgroundPath) {
    throw new Error('backgroundPath is required when layout is layered');
  }

  const filter = buildLayeredVideoFilter(copy);
  const audioFilter = buildAudioFilter(durationSec, overlayHasAudio, 1, 2);

  const args = [
    '-y',
    '-stream_loop',
    '-1',
    '-i',
    assets.backgroundPath,
    '-i',
    assets.gifPath,
    '-i',
    assets.audioPath,
    '-filter_complex',
    `${filter};${audioFilter}`,
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    '-t',
    String(durationSec),
    '-r',
    String(fps),
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  ];

  await runFfmpeg(config, args);

  return { outputPath, videoId };
}

export function buildPublicVideoUrl(config: ServerConfig, videoId: string): string {
  return `${config.publicUrl}${PublicPaths.videoFile(videoId)}`;
}

export async function cleanupWorkDir(workDir: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true });
}

export async function loadPipelinePresets(config: ServerConfig) {
  const presets = await loadAudioPresets(config.audioPresetsDir);
  if (presets.length === 0) {
    throw new Error(`No audio presets found in ${config.audioPresetsDir}`);
  }
  return presets;
}

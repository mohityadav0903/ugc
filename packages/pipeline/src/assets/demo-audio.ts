import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { VideoSpec } from '@ugc/types';
import type { AudioPreset } from './audio';

export const PlaceholderAudioMaxBytes = 50_000;

const DemoProfiles: Record<string, string> = {
  hype: '[0:a][1:a][2:a]amix=inputs=3:weights=0.45 0.35 0.2[v];[v][3:a]amix=inputs=2:weights=1 0.08,afade=t=in:st=0:d=0.4,afade=t=out:st=7.2:d=0.8,volume=1.6,loudnorm=I=-14:TP=-1:LRA=11',
  chill:
    '[0:a][1:a][2:a]amix=inputs=3:weights=0.5 0.35 0.15[v];[v][3:a]amix=inputs=2:weights=1 0.05,afade=t=in:st=0:d=0.8,afade=t=out:st=7:d=1,volume=1.2,loudnorm=I=-16:TP=-1:LRA=11',
  dramatic:
    '[0:a][1:a][2:a]amix=inputs=3:weights=0.55 0.3 0.15[v];[v][3:a]amix=inputs=2:weights=1 0.06,afade=t=in:st=0:d=0.6,afade=t=out:st=7.1:d=0.9,volume=1.4,loudnorm=I=-15:TP=-1:LRA=11',
};

const DemoFrequencies: Record<string, readonly [number, number, number]> = {
  hype: [329.63, 415.3, 523.25],
  chill: [196, 246.94, 293.66],
  dramatic: [110, 164.81, 220],
};

function buildDemoAudioArgs(
  presetId: string,
  targetPath: string,
  durationSec: number,
): string[] {
  const [f1, f2, f3] = DemoFrequencies[presetId] ?? DemoFrequencies.chill;
  const filter = DemoProfiles[presetId] ?? DemoProfiles.chill;

  return [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${f1}:sample_rate=44100:duration=${durationSec}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${f2}:sample_rate=44100:duration=${durationSec}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${f3}:sample_rate=44100:duration=${durationSec}`,
    '-f',
    'lavfi',
    '-i',
    `anoisesrc=d=${durationSec}:c=pink:a=0.02`,
    '-filter_complex',
    filter,
    '-t',
    String(durationSec),
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    targetPath,
  ];
}

export async function isPlaceholderAudioFile(path: string): Promise<boolean> {
  const file = Bun.file(path);
  if (!(await file.exists())) return true;
  return file.size < PlaceholderAudioMaxBytes;
}

export async function ensureDemoAudioFile(
  ffmpegPath: string,
  targetPath: string,
  presetId: string,
  durationSec = VideoSpec.durationSec,
): Promise<void> {
  if (!(await isPlaceholderAudioFile(targetPath))) return;

  await mkdir(dirname(targetPath), { recursive: true });

  const process = Bun.spawn([ffmpegPath, ...buildDemoAudioArgs(presetId, targetPath, durationSec)], {
    stdout: 'ignore',
    stderr: 'pipe',
  });

  const exitCode = await process.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(process.stderr).text();
    throw new Error(`Failed to create demo audio (${presetId}): ${stderr}`);
  }
}

export async function ensureDemoAudioPresets(
  ffmpegPath: string,
  presetsDir: string,
  presets: readonly AudioPreset[],
): Promise<void> {
  await Promise.all(
    presets.map((preset) =>
      ensureDemoAudioFile(ffmpegPath, `${presetsDir}/${preset.filename}`, preset.id),
    ),
  );
}

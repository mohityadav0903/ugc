import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ensureDemoAudioPresets, loadAudioPresets } from '@ugc/pipeline';
import type { ServerConfig } from '@ugc/types';

export async function bootstrapRuntime(config: ServerConfig): Promise<void> {
  await mkdir(dirname(config.databasePath), { recursive: true });
  await mkdir(config.videosDir, { recursive: true });
  await mkdir(config.audioPresetsDir, { recursive: true });

  const presets = await loadAudioPresets(config.audioPresetsDir);
  await ensureDemoAudioPresets(config.ffmpegPath, config.audioPresetsDir, presets);
}

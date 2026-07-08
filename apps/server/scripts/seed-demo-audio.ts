import { resolve } from 'node:path';
import { ensureDemoAudioPresets, loadAudioPresets } from '@ugc/pipeline';
import { loadResolvedServerConfig } from '../src/config.js';

const config = loadResolvedServerConfig(process.env);

const presets = await loadAudioPresets(config.audioPresetsDir);
await ensureDemoAudioPresets(config.ffmpegPath, config.audioPresetsDir, presets);

console.log(`Seeded demo audio in ${resolve(config.audioPresetsDir)}`);

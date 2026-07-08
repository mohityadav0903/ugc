import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface AudioPreset {
  id: string;
  filename: string;
  label: string;
  mood?: string;
}

const PresetManifestFilename = 'presets.json';

interface PresetManifestEntry {
  id: string;
  filename: string;
  label: string;
  mood?: string;
}

export async function loadAudioPresets(directory: string): Promise<AudioPreset[]> {
  const manifestPath = join(directory, PresetManifestFilename);
  const manifestFile = Bun.file(manifestPath);

  if (await manifestFile.exists()) {
    const manifest = (await manifestFile.json()) as PresetManifestEntry[];
    return manifest.map((entry) => ({
      id: entry.id,
      filename: entry.filename,
      label: entry.label,
      mood: entry.mood,
    }));
  }

  const entries = await readdir(directory);
  const mp3Files = entries.filter((name) => name.endsWith('.mp3')).sort();

  return mp3Files.map((filename) => {
    const id = filename.replace(/\.mp3$/i, '');
    return { id, filename, label: id };
  });
}

export function resolvePresetPath(directory: string, preset: AudioPreset): string {
  return join(directory, preset.filename);
}

export function findPresetById(
  presets: readonly AudioPreset[],
  presetId: string,
): AudioPreset | null {
  return presets.find((preset) => preset.id === presetId) ?? null;
}

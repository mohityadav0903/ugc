import { EnvKeys } from '../constants/env';
import { DEFAULT_SERVER_PORT } from '../constants/ports';
import {
  DefaultFfmpegPath,
  DefaultModels,
  DefaultPaths,
  DefaultPublicUrl,
} from './defaults';

export type EnvSource = Record<string, string | undefined>;

export interface ServerConfig {
  openaiApiKey: string;
  pexelsApiKey: string;
  giphyApiKey: string;
  klipyApiKey?: string;
  jamendoClientId?: string;
  tavilyApiKey?: string;
  databasePath: string;
  videosDir: string;
  audioPresetsDir: string;
  publicUrl: string;
  serverPort: number;
  chatModel: string;
  planModel: string;
  ffmpegPath: string;
  isProduction: boolean;
}

function required(env: EnvSource, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(env: EnvSource, key: string, fallback: string): string {
  return env[key]?.trim() || fallback;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

export function loadServerConfig(env: EnvSource): ServerConfig {
  return {
    openaiApiKey: required(env, EnvKeys.openaiApiKey),
    pexelsApiKey: required(env, EnvKeys.pexelsApiKey),
    giphyApiKey: required(env, EnvKeys.giphyApiKey),
    klipyApiKey: env[EnvKeys.klipyApiKey]?.trim() || undefined,
    jamendoClientId: env[EnvKeys.jamendoClientId]?.trim() || undefined,
    tavilyApiKey: env[EnvKeys.tavilyApiKey]?.trim() || undefined,
    databasePath: optional(env, EnvKeys.databasePath, DefaultPaths.database),
    videosDir: optional(env, EnvKeys.videosDir, DefaultPaths.videos),
    audioPresetsDir: optional(env, EnvKeys.audioPresetsDir, DefaultPaths.audioPresets),
    publicUrl: optional(env, EnvKeys.publicUrl, DefaultPublicUrl).replace(/\/$/, ''),
    serverPort: parsePort(optional(env, EnvKeys.serverPort, String(DEFAULT_SERVER_PORT))),
    chatModel: optional(env, EnvKeys.openaiModel, DefaultModels.chat),
    planModel: optional(env, EnvKeys.planModel, DefaultModels.plan),
    ffmpegPath: optional(env, EnvKeys.ffmpegPath, DefaultFfmpegPath),
    isProduction: optional(env, EnvKeys.nodeEnv, 'development') === 'production',
  };
}

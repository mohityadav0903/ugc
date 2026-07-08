import { isAbsolute, resolve } from 'node:path';
import type { EnvSource, ServerConfig } from '@ugc/types';
import { loadServerConfig } from '@ugc/types';

const projectRoot = resolve(import.meta.dir, '../../..');

function resolveDataPath(path: string): string {
  return isAbsolute(path) ? path : resolve(projectRoot, path);
}

export function loadResolvedServerConfig(env: EnvSource): ServerConfig {
  const config = loadServerConfig(env);
  return {
    ...config,
    databasePath: resolveDataPath(config.databasePath),
    videosDir: resolveDataPath(config.videosDir),
    audioPresetsDir: resolveDataPath(config.audioPresetsDir),
  };
}

export function getProjectRoot(): string {
  return projectRoot;
}

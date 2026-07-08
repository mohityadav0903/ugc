import type { Database } from '@ugc/db';
import { createSqliteDatabase } from '@ugc/db';
import type { EnvSource, ServerConfig } from '@ugc/types';
import { loadResolvedServerConfig } from './config.js';

export interface AppContext {
  config: ServerConfig;
  db: Database;
}

export function createAppContext(config: ServerConfig): AppContext {
  const db = createSqliteDatabase(config.databasePath);
  return { config, db };
}

export function loadAppContext(env: EnvSource): AppContext {
  return createAppContext(loadResolvedServerConfig(env));
}

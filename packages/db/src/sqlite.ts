import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Database as BunDatabase } from 'bun:sqlite';
import { DefaultThreadTitle } from '@ugc/types';
import type {
  AddGenerationInput,
  AddMessageInput,
  CreateThreadInput,
  Database,
  GenerationRecord,
  MessageRecord,
  StoredUiMessage,
  ThreadRecord,
} from './types';

interface ThreadRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  ui_messages: string | null;
}

interface MessageRow {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  metadata: string | null;
  created_at: number;
}

interface GenerationRow {
  id: string;
  thread_id: string;
  message_id: string | null;
  video_url: string;
  plan_json: string;
  created_at: number;
}

function toThread(row: ThreadRow): ThreadRecord {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role as MessageRecord['role'],
    content: row.content,
    metadata: row.metadata ? (JSON.parse(row.metadata) as MessageRecord['metadata']) : null,
    createdAt: row.created_at,
  };
}

function toGeneration(row: GenerationRow): GenerationRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    messageId: row.message_id,
    videoUrl: row.video_url,
    planJson: row.plan_json,
    createdAt: row.created_at,
  };
}

function initSchema(db: BunDatabase): void {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      message_id TEXT,
      video_url TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_generations_thread ON generations(thread_id, created_at);
  `);

  const threadColumns = db.query('PRAGMA table_info(threads)').all() as Array<{ name: string }>;
  if (!threadColumns.some((column) => column.name === 'ui_messages')) {
    db.exec('ALTER TABLE threads ADD COLUMN ui_messages TEXT');
  }
}

export function createSqliteDatabase(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new BunDatabase(path);
  initSchema(db);

  return {
    async listThreads() {
      const rows = db
        .query('SELECT * FROM threads ORDER BY updated_at DESC')
        .all() as ThreadRow[];
      return rows.map(toThread);
    },

    async getThread(id) {
      const row = db.query('SELECT * FROM threads WHERE id = ?').get(id) as ThreadRow | null;
      return row ? toThread(row) : null;
    },

    async createThread(input: CreateThreadInput) {
      const now = Date.now();
      const thread: ThreadRecord = {
        id: input.id ?? randomUUID(),
        title: input.title ?? DefaultThreadTitle,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      };
      db.query(
        'INSERT INTO threads (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ).run(thread.id, thread.title, thread.createdAt, thread.updatedAt);
      return thread;
    },

    async updateThreadTitle(id, title) {
      const existing = db.query('SELECT * FROM threads WHERE id = ?').get(id) as ThreadRow | null;
      if (!existing) {
        throw new Error(`Thread not found: ${id}`);
      }
      const updatedAt = Date.now();
      db.query('UPDATE threads SET title = ?, updated_at = ? WHERE id = ?').run(
        title,
        updatedAt,
        id,
      );
      return toThread({ ...existing, title, updated_at: updatedAt });
    },

    async deleteThread(id) {
      db.query('DELETE FROM generations WHERE thread_id = ?').run(id);
      db.query('DELETE FROM messages WHERE thread_id = ?').run(id);
      db.query('DELETE FROM threads WHERE id = ?').run(id);
    },

    async listMessages(threadId) {
      const rows = db
        .query('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC')
        .all(threadId) as MessageRow[];
      return rows.map(toMessage);
    },

    async addMessage(input: AddMessageInput) {
      const message: MessageRecord = {
        id: input.id ?? randomUUID(),
        threadId: input.threadId,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? null,
        createdAt: input.createdAt ?? Date.now(),
      };
      db.query(
        'INSERT INTO messages (id, thread_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(
        message.id,
        message.threadId,
        message.role,
        message.content,
        message.metadata ? JSON.stringify(message.metadata) : null,
        message.createdAt,
      );
      db.query('UPDATE threads SET updated_at = ? WHERE id = ?').run(message.createdAt, message.threadId);
      return message;
    },

    async addGeneration(input: AddGenerationInput) {
      const generation: GenerationRecord = {
        id: input.id ?? randomUUID(),
        threadId: input.threadId,
        messageId: input.messageId ?? null,
        videoUrl: input.videoUrl,
        planJson: input.planJson,
        createdAt: input.createdAt ?? Date.now(),
      };
      db.query(
        'INSERT INTO generations (id, thread_id, message_id, video_url, plan_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(
        generation.id,
        generation.threadId,
        generation.messageId,
        generation.videoUrl,
        generation.planJson,
        generation.createdAt,
      );
      return generation;
    },

    async listGenerations(threadId) {
      const rows = db
        .query('SELECT * FROM generations WHERE thread_id = ? ORDER BY created_at ASC')
        .all(threadId) as GenerationRow[];
      return rows.map(toGeneration);
    },

    async getThreadUiMessages(threadId) {
      const row = db.query('SELECT ui_messages FROM threads WHERE id = ?').get(threadId) as
        | Pick<ThreadRow, 'ui_messages'>
        | null;
      if (!row?.ui_messages) return null;
      return JSON.parse(row.ui_messages) as StoredUiMessage[];
    },

    async setThreadUiMessages(threadId, messages) {
      db.query('UPDATE threads SET ui_messages = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(messages),
        Date.now(),
        threadId,
      );
    },
  };
}

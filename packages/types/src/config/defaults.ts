import { OpenAiModels } from '../constants/models';

export const DefaultPaths = {
  database: './data/app.db',
  videos: './data/videos',
  audioPresets: './data/audio',
} as const;

export const DefaultModels = {
  chat: OpenAiModels.chat,
  plan: OpenAiModels.plan,
} as const;

export const DefaultPublicUrl = 'http://localhost:3000' as const;

export const DefaultFfmpegPath = 'ffmpeg' as const;

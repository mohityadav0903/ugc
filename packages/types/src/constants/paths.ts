export const API_PREFIX = '/api' as const;

export const ApiRoutes = {
  health: `${API_PREFIX}/health`,
  chat: `${API_PREFIX}/chat`,
  threads: `${API_PREFIX}/threads`,
  thread: (id: string) => `${API_PREFIX}/threads/${id}`,
  threadMessages: (id: string) => `${API_PREFIX}/threads/${id}/messages`,
} as const;

export const PublicPaths = {
  videos: '/videos',
  videoFile: (id: string) => `/videos/${id}.mp4`,
} as const;

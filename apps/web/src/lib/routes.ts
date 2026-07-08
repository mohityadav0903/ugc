export const WebRoutes = {
  home: '/',
  chatIndex: '/chat',
  chat: (threadId: string) => `/chat/${threadId}`,
} as const;

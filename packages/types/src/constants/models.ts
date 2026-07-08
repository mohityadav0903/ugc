export const OpenAiModels = {
  chat: 'gpt-5.4-mini',
  plan: 'gpt-5.4-nano',
  balanced: 'gpt-5.5',
  flagship: 'gpt-5.5-pro',
  chatLatest: 'chat-latest',
  fast: {
    chat: 'gpt-5.4-mini',
    plan: 'gpt-5.4-nano',
  },
  preview: {
    sol: 'gpt-5.6-sol',
    terra: 'gpt-5.6-terra',
    luna: 'gpt-5.6-luna',
  },
} as const;

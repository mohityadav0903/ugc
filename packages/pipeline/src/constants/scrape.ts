export const ScrapeLimits = {
  bodySnippetChars: 2_000,
  headingCount: 8,
  fetchTimeoutMs: 15_000,
  userAgent: 'ugc-bot/1.0',
} as const;

export const UrlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

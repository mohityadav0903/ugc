export const MessageRoles = {
  user: 'user',
  assistant: 'assistant',
  tool: 'tool',
} as const;

export type MessageRole = (typeof MessageRoles)[keyof typeof MessageRoles];

export const DefaultThreadTitle = 'New chat' as const;

export interface ChatErrorDetails {
  title: string;
  hint?: string;
}

export function getChatErrorDetails(message: string): ChatErrorDetails {
  const lower = message.toLowerCase();

  if (lower.includes('quota') || lower.includes('billing')) {
    return {
      title: 'OpenAI quota exceeded',
      hint: 'Add credits or check billing at platform.openai.com, then retry.',
    };
  }

  if (lower.includes('api key') || lower.includes('incorrect api key')) {
    return {
      title: 'Invalid API key',
      hint: 'Check OPENAI_API_KEY in apps/server/.env.',
    };
  }

  if (lower.includes('rate limit')) {
    return {
      title: 'Rate limited',
      hint: 'Wait a moment and try again.',
    };
  }

  return { title: 'Request failed' };
}

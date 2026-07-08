const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

export interface TavilySearchResult {
  title: string;
  content: string;
  url: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
}

export async function searchTavily(
  apiKey: string,
  query: string,
  options: { maxResults?: number; timeRange?: 'week' | 'month' } = {},
): Promise<TavilySearchResponse> {
  const response = await fetch(TAVILY_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: options.maxResults ?? 5,
      time_range: options.timeRange ?? 'month',
      include_answer: true,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    query: string;
    answer?: string;
    results?: Array<{
      title?: string;
      content?: string;
      url?: string;
      score?: number;
    }>;
  };

  return {
    query,
    answer: payload.answer,
    results: (payload.results ?? []).map((result) => ({
      title: result.title ?? '',
      content: result.content ?? '',
      url: result.url ?? '',
      score: result.score ?? 0,
    })),
  };
}

export function formatTavilyContext(responses: TavilySearchResponse[]): string {
  const sections = responses.map((response) => {
    const snippets = response.results
      .slice(0, 4)
      .map((result) => `- ${result.title}: ${result.content.slice(0, 280)}`)
      .join('\n');

    return [
      `Query: ${response.query}`,
      response.answer ? `Summary: ${response.answer}` : null,
      snippets ? `Snippets:\n${snippets}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return sections.join('\n\n');
}

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { ResearchTrendsInput, ResearchTrendsResult } from '@ugc/types';
import { trendResearchSchema } from '@ugc/types';
import { filterMemeCatalog, formatCatalogContext } from '../data/meme-catalog';
import { formatTavilyContext, searchTavily } from '../services/tavily';
import type { PipelineToolContext } from './context';
import { toToolFailure } from './context';

const TrendSynthesisPrompt = `You synthesize TikTok/Reels meme trends for UGC promo videos.

Given web search results and/or a meme catalog, return:
- memeFormats: 3-5 current video formats (e.g. "POV snack scan", "gym bro revelation", "influencer reaction cut")
- viralInfluencers: 3-5 funny or viral creators relevant to this niche — names people recognize (e.g. Khaby Lame, Duke Dennis, niche fitness creators)
- famousMemes: 4-6 specific recognizable meme names tied to the trend (e.g. "side eye chloe", "confused math lady", "khaby lame shrug")
- hotMemes: 4-6 Giphy-searchable phrases derived from famousMemes and influencer signature reactions — use exact searchable names, not descriptions
- audioVibes: 3-4 audio mood descriptors for background music search
- hookPatterns: 3-4 hook templates in TikTok meme voice — start with "me when", "POV:", or "nobody told me" and weave the product domain in
- trendNotes: 1-2 sentence summary of what's working right now for this niche

Prioritize memes and influencer formats that feel current for this niche, not random dated 2019 memes unless still viral.
hotMemes must be copy-pasteable into Giphy search — prefer famous meme names and influencer reaction clips over generic phrases.`;

export async function runResearchTrends(
  ctx: PipelineToolContext,
  input: ResearchTrendsInput,
): Promise<ResearchTrendsResult> {
  try {
    const tavilyApiKey = ctx.config.tavilyApiKey;
    if (!tavilyApiKey) {
      return {
        ok: false,
        error: 'TAVILY_API_KEY is required for trend research — add it to apps/server/.env',
      };
    }

    const niche = input.niche.trim();
    const productName = input.productName.trim() || undefined;
    const vibe = input.vibe.trim() || undefined;
    const catalogEntries = filterMemeCatalog(niche, vibe);
    const catalogContext = formatCatalogContext(catalogEntries);

    const productBit = productName ? ` ${productName}` : '';
    const vibeBit = vibe ? ` ${vibe}` : '';
    const queries = [
      `TikTok viral memes${productBit} ${niche}${vibeBit} 2025`,
      `funny TikTok influencers ${niche}${vibeBit} viral`,
      `famous reaction memes ${niche} reels short form`,
      `trending meme celebrities ${niche} TikTok 2025`,
      `${niche} TikTok hook trends UGC promo`,
    ];

    let searchContext = '';
    let searchSource: 'tavily' | 'catalog' = 'tavily';

    try {
      const responses = await Promise.all(
        queries.map((query) =>
          searchTavily(tavilyApiKey, query, { maxResults: 5, timeRange: 'month' }),
        ),
      );
      searchContext = formatTavilyContext(responses);
    } catch {
      searchSource = 'catalog';
      searchContext = '';
    }

    const openai = createOpenAI({ apiKey: ctx.config.openaiApiKey });
    const { object } = await generateObject({
      model: openai(ctx.config.planModel),
      schema: trendResearchSchema.omit({ searchSource: true }),
      system: TrendSynthesisPrompt,
      prompt: [
        `Niche: ${niche}`,
        productName ? `Product: ${productName}` : null,
        vibe ? `Vibe: ${vibe}` : null,
        searchContext
          ? `Web search (primary — ground trends in this):\n${searchContext}`
          : 'Web search failed. Use catalog hints only — quality will be lower.',
        `Meme catalog hints (secondary):\n${catalogContext}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });

    return { ok: true, ...object, searchSource };
  } catch (error) {
    return toToolFailure(error);
  }
}

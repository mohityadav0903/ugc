import {
  renderUgcVideoInputSchema,
  researchProductInputSchema,
  researchTrendsInputSchema,
  searchAssetsInputSchema,
  ToolNames,
} from '@ugc/types';
import { tool } from 'ai';
import type { PipelineToolContext } from './context';
import { runRenderUgcVideo } from './render-ugc-video';
import { runResearchProduct } from './research-product';
import { runResearchTrends } from './research-trends';
import { runSearchAssets } from './search-assets';

export interface CreatePipelineToolsOptions {
  threadId: string;
}

export function createPipelineTools(ctx: PipelineToolContext, _options: CreatePipelineToolsOptions) {
  return {
    [ToolNames.researchProduct]: tool({
      description:
        'Research a product from its URL. Call first when the user shared a product or landing page URL.',
      parameters: researchProductInputSchema,
      execute: async (input) => runResearchProduct(ctx, input),
    }),

    [ToolNames.researchTrends]: tool({
      description:
        'Research TikTok/Reels trends via web search: funny influencers, famous memes, and viral formats for the niche. Returns viralInfluencers, famousMemes, hotMemes (Giphy queries), hookPatterns. Call after product research (or first if no URL).',
      parameters: researchTrendsInputSchema,
      execute: async (input) => runResearchTrends(ctx, input),
    }),

    [ToolNames.searchAssets]: tool({
      description:
        'Search Giphy clips, Pexels videos, and Jamendo audio. Returns metadata + thumbnailUrl per candidate. Thumbnail previews are sent as image blocks after this tool runs.',
      parameters: searchAssetsInputSchema,
      execute: async (input) => runSearchAssets(ctx, input),
    }),

    [ToolNames.renderUgcVideo]: tool({
      description:
        'Render the final video. Pass layout (full_bleed or layered), hook/subtext/vibe, and sourceUrls from search_assets. full_bleed = meme only; layered = background + centered meme.',
      parameters: renderUgcVideoInputSchema,
      execute: async (input) => runRenderUgcVideo(ctx, input),
    }),
  };
}

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { ResearchProductInput, ResearchProductResult } from '@ugc/types';
import { productResearchSchema } from '@ugc/types';
import { scrapeUrl, summarizeScrapedPage } from '../scrape';
import type { PipelineToolContext } from './context';
import { toToolFailure } from './context';

const ProductResearchPrompt = `Extract structured product research from scraped page context.
Be specific to the actual product. No generic marketing filler.`;

export async function runResearchProduct(
  ctx: PipelineToolContext,
  input: ResearchProductInput,
): Promise<ResearchProductResult> {
  try {
    const url = input.url.trim();
    if (!url) {
      return {
        ok: true,
        productName: 'Unknown product',
        tagline: '',
        audience: 'general consumers',
        keyFeatures: [],
        competitorAngle: '',
        scrapeStatus: 'skipped',
      };
    }

    let scrapedSummary: string;
    let scrapeStatus: 'ok' | 'failed' = 'ok';

    try {
      const scraped = await scrapeUrl(url);
      scrapedSummary = summarizeScrapedPage(scraped);
    } catch {
      scrapedSummary = `URL: ${url}`;
      scrapeStatus = 'failed';
    }

    const openai = createOpenAI({ apiKey: ctx.config.openaiApiKey });
    const { object } = await generateObject({
      model: openai(ctx.config.planModel),
      schema: productResearchSchema.omit({ scrapeStatus: true }),
      system: ProductResearchPrompt,
      prompt: scrapedSummary,
    });

    return { ok: true, ...object, scrapeStatus };
  } catch (error) {
    return toToolFailure(error);
  }
}

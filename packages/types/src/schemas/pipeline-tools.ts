import { z } from 'zod';
import { generationTraceSchema } from './tools';

export const toolFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export type ToolFailure = z.infer<typeof toolFailureSchema>;

export const assetCandidateSchema = z.object({
  id: z.string(),
  label: z.string(),
  sourceUrl: z.string().url(),
  meta: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSec: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  source: z.enum(['klipy', 'giphy', 'pexels', 'jamendo']).optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasAudio: z.boolean().optional(),
});

export type AssetCandidate = z.infer<typeof assetCandidateSchema>;

// --- research_product ---

export const researchProductInputSchema = z.object({
  url: z.string().min(1).describe('Product or landing page URL with https://'),
});

export type ResearchProductInput = z.infer<typeof researchProductInputSchema>;

export const productResearchSchema = z.object({
  productName: z.string(),
  tagline: z.string(),
  audience: z.string(),
  keyFeatures: z.array(z.string()),
  competitorAngle: z.string(),
  scrapeStatus: z.enum(['ok', 'failed', 'skipped']),
});

export type ProductResearch = z.infer<typeof productResearchSchema>;

export const researchProductSuccessSchema = productResearchSchema.extend({
  ok: z.literal(true),
});

export const researchProductResultSchema = z.discriminatedUnion('ok', [
  researchProductSuccessSchema,
  toolFailureSchema,
]);

export type ResearchProductResult = z.infer<typeof researchProductResultSchema>;

// --- research_trends ---

export const researchTrendsInputSchema = z.object({
  niche: z.string().min(1).describe('Target audience niche'),
  productName: z
    .string()
    .describe('Product name if known. Use empty string if unknown.'),
  vibe: z
    .string()
    .describe('Desired tone or vibe if mentioned. Use empty string if unknown.'),
});

export type ResearchTrendsInput = z.infer<typeof researchTrendsInputSchema>;

export const trendResearchSchema = z.object({
  memeFormats: z.array(z.string()),
  viralInfluencers: z.array(z.string()),
  famousMemes: z.array(z.string()),
  hotMemes: z.array(z.string()),
  audioVibes: z.array(z.string()),
  hookPatterns: z.array(z.string()),
  trendNotes: z.string(),
  searchSource: z.enum(['tavily', 'catalog']),
});

export type TrendResearch = z.infer<typeof trendResearchSchema>;

export const researchTrendsSuccessSchema = trendResearchSchema.extend({
  ok: z.literal(true),
});

export const researchTrendsResultSchema = z.discriminatedUnion('ok', [
  researchTrendsSuccessSchema,
  toolFailureSchema,
]);

export type ResearchTrendsResult = z.infer<typeof researchTrendsResultSchema>;

// --- search_assets ---

export const searchAssetsInputSchema = z.object({
  gifQuery: z
    .string()
    .min(1)
    .max(40)
    .describe(
      'Giphy clip search — influencer name or famousMeme from research_trends (e.g. "khaby lame", "confused math lady"). KLIPY is searched first when KLIPY_API_KEY is set.',
    ),
  backgroundQuery: z
    .string()
    .min(1)
    .max(60)
    .describe(
      'Pexels search for sharp lifestyle interior or aesthetic scene (e.g. "modern apartment aesthetic", "luxury living room")',
    ),
  audioPresetId: z
    .enum(['hype', 'chill', 'dramatic'])
    .describe('Audio mood preset for Jamendo search'),
  audioSearch: z
    .string()
    .max(40)
    .describe('Jamendo vibe search terms. Use empty string to skip.'),
});

export type SearchAssetsInput = z.infer<typeof searchAssetsInputSchema>;

export const searchAssetsSuccessSchema = z.object({
  ok: z.literal(true),
  memes: z.array(assetCandidateSchema),
  backgrounds: z.array(assetCandidateSchema),
  audio: z.array(assetCandidateSchema),
  memeSearchNote: z.string().optional(),
});

export const searchAssetsResultSchema = z.discriminatedUnion('ok', [
  searchAssetsSuccessSchema,
  toolFailureSchema,
]);

export type SearchAssetsResult = z.infer<typeof searchAssetsResultSchema>;

// --- render_ugc_video ---

export const videoLayoutSchema = z.enum(['full_bleed', 'layered']);

export type VideoLayout = z.infer<typeof videoLayoutSchema>;

export const renderUgcVideoInputSchema = z
  .object({
    hook: z.string().min(1).max(66).describe('On-screen hook text'),
    subtext: z.string().min(1).max(32).describe('CTA or domain shown below hook'),
    vibe: z.string().min(1).max(40).describe('Short vibe label for metadata'),
    sourceUrl: z
      .string()
      .describe('Product URL if available. Use empty string if none.'),
    layout: videoLayoutSchema.describe(
      'full_bleed: meme clip fills the frame (no Pexels background). layered: aesthetic background video with meme centered on top.',
    ),
    memeSourceUrl: z.string().min(1).describe('sourceUrl of the chosen meme from search_assets'),
    backgroundSourceUrl: z
      .string()
      .describe(
        'sourceUrl of chosen background from search_assets when layout is layered. Use empty string for full_bleed.',
      ),
    audioSourceUrl: z.string().min(1).describe('sourceUrl of the chosen audio track from search_assets'),
    memeLabel: z.string().describe('Label of chosen meme for trace. Use empty string if none.'),
    backgroundLabel: z
      .string()
      .describe('Label of chosen background for trace. Use empty string when layout is full_bleed.'),
    audioLabel: z.string().describe('Label of chosen audio for trace. Use empty string if none.'),
    audioPresetId: z.enum(['hype', 'chill', 'dramatic']).describe('Audio preset used during search'),
  })
  .superRefine((data, ctx) => {
    if (data.layout === 'layered' && !data.backgroundSourceUrl.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'backgroundSourceUrl is required when layout is layered',
        path: ['backgroundSourceUrl'],
      });
    }
    if (data.layout === 'full_bleed' && data.backgroundSourceUrl.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'backgroundSourceUrl must be empty when layout is full_bleed',
        path: ['backgroundSourceUrl'],
      });
    }
  });

export type RenderUgcVideoInput = z.infer<typeof renderUgcVideoInputSchema>;

export const renderUgcVideoOutputSchema = z.object({
  videoUrl: z.string(),
  hook: z.string(),
  vibe: z.string(),
  sourceUrl: z.string().optional(),
  trace: generationTraceSchema,
});

export type RenderUgcVideoOutput = z.infer<typeof renderUgcVideoOutputSchema>;

export const renderUgcVideoSuccessSchema = renderUgcVideoOutputSchema.extend({
  ok: z.literal(true),
});

export const renderUgcVideoResultSchema = z.discriminatedUnion('ok', [
  renderUgcVideoSuccessSchema,
  toolFailureSchema,
]);

export type RenderUgcVideoResult = z.infer<typeof renderUgcVideoResultSchema>;

export function isRenderUgcVideoSuccess(
  result: RenderUgcVideoResult,
): result is z.infer<typeof renderUgcVideoSuccessSchema> {
  return result.ok === true;
}

import { z } from 'zod';
import { ugcPlanSchema } from './ugc-plan';

export const generateUgcVideoInputSchema = z.object({
  message: z
    .string()
    .min(1)
    .describe('The user request describing the product, vibe, or creative direction'),
  url: z
    .string()
    .describe(
      'Product or landing page URL with https:// when available. Use an empty string if the user did not provide one.',
    ),
});

export type GenerateUgcVideoInput = z.infer<typeof generateUgcVideoInputSchema>;

export const generationTraceSchema = z.object({
  resolvedUrl: z.string().optional(),
  productImageUrl: z.string().nullable(),
  scrapeStatus: z.enum(['ok', 'failed', 'skipped']),
});

export type GenerationTrace = z.infer<typeof generationTraceSchema>;

export const generateUgcVideoOutputSchema = z.object({
  videoUrl: z.string(),
  hook: z.string(),
  vibe: z.string(),
  plan: ugcPlanSchema,
  sourceUrl: z.string().optional(),
  trace: generationTraceSchema,
});

export type GenerateUgcVideoOutput = z.infer<typeof generateUgcVideoOutputSchema>;

export const generateUgcVideoFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export type GenerateUgcVideoFailure = z.infer<typeof generateUgcVideoFailureSchema>;

export const generateUgcVideoSuccessSchema = generateUgcVideoOutputSchema.extend({
  ok: z.literal(true),
});

export type GenerateUgcVideoSuccess = z.infer<typeof generateUgcVideoSuccessSchema>;

export const generateUgcVideoResultSchema = z.discriminatedUnion('ok', [
  generateUgcVideoSuccessSchema,
  generateUgcVideoFailureSchema,
]);

export type GenerateUgcVideoResult = z.infer<typeof generateUgcVideoResultSchema>;

export function isGenerateUgcVideoSuccess(
  result: GenerateUgcVideoResult,
): result is GenerateUgcVideoSuccess {
  return result.ok === true;
}

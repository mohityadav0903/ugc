import { z } from 'zod';

export const ugcPlanSchema = z.object({
  productName: z.string().min(2).max(60),
  niche: z.string().min(3).max(80),
  vibe: z.string().min(3).max(40),
  hook: z.string().min(8).max(66),
  subtext: z.string().min(1).max(32),
  gifQuery: z.string().min(3).max(40),
  backgroundQuery: z.string().min(3).max(60),
  audioPresetId: z.string().min(1),
});

export type UgcPlan = z.infer<typeof ugcPlanSchema>;

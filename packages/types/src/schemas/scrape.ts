import { z } from 'zod';

export const scrapedPageSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  ogImage: z.string().url().nullable(),
  headings: z.array(z.string()),
  bodySnippet: z.string(),
});

export type ScrapedPage = z.infer<typeof scrapedPageSchema>;

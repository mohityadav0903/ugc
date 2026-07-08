import * as cheerio from 'cheerio';
import type { ScrapedPage } from '@ugc/types';
import { ScrapeLimits } from './constants/scrape';

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractHeadings($: cheerio.CheerioAPI): string[] {
  const headings: string[] = [];
  $('h1, h2, h3').each((_, element) => {
    const text = cleanText($(element).text());
    if (text) headings.push(text);
  });
  return headings.slice(0, ScrapeLimits.headingCount);
}

function extractBodySnippet($: cheerio.CheerioAPI): string {
  const paragraphs: string[] = [];
  $('p').each((_, element) => {
    const text = cleanText($(element).text());
    if (text.length > 40) paragraphs.push(text);
  });
  return paragraphs.join(' ').slice(0, ScrapeLimits.bodySnippetChars);
}

function resolveOgImage(raw: string | undefined, pageUrl: string): string | null {
  if (!raw?.trim()) return null;
  try {
    const resolved = new URL(raw.trim(), pageUrl).href;
    return resolved.startsWith('http') ? resolved : null;
  } catch {
    return null;
  }
}

export async function scrapeUrl(url: string): Promise<ScrapedPage> {
  const response = await fetch(url, {
    headers: { 'User-Agent': ScrapeLimits.userAgent },
    signal: AbortSignal.timeout(ScrapeLimits.fetchTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Scrape failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = cleanText($('title').first().text()) || new URL(url).hostname;
  const description =
    cleanText($('meta[name="description"]').attr('content') ?? '') ||
    cleanText($('meta[property="og:description"]').attr('content') ?? '');
  const ogImage = resolveOgImage(
    $('meta[property="og:image"]').attr('content'),
    url,
  );

  return {
    url,
    title,
    description,
    ogImage,
    headings: extractHeadings($),
    bodySnippet: extractBodySnippet($),
  };
}

export function summarizeScrapedPage(page: ScrapedPage): string {
  const lines = [
    `URL: ${page.url}`,
    `Title: ${page.title}`,
    `Description: ${page.description}`,
    `Headings: ${page.headings.join(' | ')}`,
    `Body: ${page.bodySnippet}`,
  ];
  return lines.join('\n');
}

export function extractUrlFromMessage(message: string): string | null {
  const httpMatch = message.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  if (httpMatch?.[0]) return httpMatch[0];

  const domainMatch = message.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/i);
  return domainMatch?.[0] ? normalizeProductUrl(domainMatch[0]) : null;
}

export function normalizeProductUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { AssetLimits } from '../constants/assets';
import { ScrapeLimits } from '../constants/scrape';

const AllowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function extensionFromContentType(contentType: string): string | null {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  return null;
}

function extensionFromUrl(imageUrl: string): string | null {
  try {
    const ext = extname(new URL(imageUrl).pathname).toLowerCase();
    return AllowedExtensions.has(ext) ? ext : null;
  } catch {
    return null;
  }
}

export async function downloadProductImage(
  imageUrl: string,
  workDir: string,
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': ScrapeLimits.userAgent },
      signal: AbortSignal.timeout(AssetLimits.downloadTimeoutMs),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    const ext =
      extensionFromContentType(contentType) ??
      extensionFromUrl(imageUrl) ??
      '.jpg';

    await mkdir(workDir, { recursive: true });
    const targetPath = join(workDir, `product${ext}`);
    await writeFile(targetPath, Buffer.from(await response.arrayBuffer()));
    return targetPath;
  } catch {
    return null;
  }
}

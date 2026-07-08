const VIDEO_URL_PATTERN = /https?:\/\/[^\s]+\.mp4/;

export function parseToolVideoUrl(content: string): string | null {
  return content.match(VIDEO_URL_PATTERN)?.[0] ?? null;
}

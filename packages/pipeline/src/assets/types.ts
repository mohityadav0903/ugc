export interface AssetOption {
  id: string;
  label: string;
  sourceUrl: string;
  meta?: string;
  thumbnailUrl?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  source?: 'klipy' | 'giphy' | 'pexels' | 'jamendo';
  title?: string;
  author?: string;
  tags?: string[];
  hasAudio?: boolean;
}

export function dedupeAssetOptions(options: AssetOption[]): AssetOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.sourceUrl)) return false;
    seen.add(option.sourceUrl);
    return true;
  });
}

import type { AssetOption } from './types';

export function rankMemeCandidates(options: AssetOption[]): AssetOption[] {
  return [...options].sort((left, right) => {
    const score = (meta?: string) => {
      if (meta === 'klipy-clip-portrait') return 8;
      if (meta === 'klipy-clip') return 7;
      if (meta === 'klipy-gif-mp4-portrait') return 6;
      if (meta === 'klipy-gif-mp4') return 5;
      if (meta === 'klipy-meme-mp4-portrait') return 4;
      if (meta === 'klipy-meme-mp4') return 3;
      if (meta === 'giphy-clip-portrait') return 4;
      if (meta === 'giphy-clip') return 3;
      if (meta === 'giphy-gif-mp4-portrait') return 2;
      if (meta === 'giphy-gif-mp4') return 1;
      if (meta === 'pexels-meme-portrait') return 0;
      if (meta === 'pexels-meme') return -1;
      return -2;
    };
    return score(right.meta) - score(left.meta);
  });
}

export const VideoSpec = {
  width: 1080,
  height: 1920,
  durationSec: 8,
  fps: 30,
  extension: 'mp4',
} as const;

export const VideoLayers = {
  background: 'background',
  text: 'text',
  gif: 'gif',
  audio: 'audio',
} as const;

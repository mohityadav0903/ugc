export const ComposeTimeouts = {
  ffmpegMs: 120_000,
} as const;

export const TextOverlay = {
  hookFontSize: 48,
  subtextFontSize: 32,
  hookMaxCharsPerLine: 22,
  hookMaxLines: 4,
  subtextMaxChars: 28,
  topMargin: 120,
  hookSubtextGap: 24,
  lineGap: 10,
  strokeWidth: 4,
} as const;

export const GifOverlay = {
  width: 920,
} as const;

export const BackgroundFx = {
  brightness: -0.02,
  saturation: 1.05,
} as const;

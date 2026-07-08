import { TextOverlay } from './constants/compose';

function truncateLine(line: string, maxCharsPerLine: number): string {
  if (line.length <= maxCharsPerLine) return line;
  return `${line.slice(0, maxCharsPerLine - 1).trimEnd()}…`;
}

export function wrapOverlayLines(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of normalized.split(' ')) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(truncateLine(current, maxCharsPerLine));
      current = '';
    }

    if (lines.length >= maxLines) break;

    if (word.length > maxCharsPerLine) {
      lines.push(truncateLine(word, maxCharsPerLine));
    } else {
      current = word;
    }

    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(truncateLine(current, maxCharsPerLine));
  }

  if (lines.length === 0 && normalized) {
    return [truncateLine(normalized, maxCharsPerLine)];
  }

  return lines.slice(0, maxLines);
}

export function escapeDrawText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%');
}

export function hookYForLine(index: number): number {
  const lineHeight = TextOverlay.hookFontSize + TextOverlay.lineGap;
  return TextOverlay.topMargin + index * lineHeight;
}

export function subtextYForHookLineCount(hookLineCount: number): number {
  const lineHeight = TextOverlay.hookFontSize + TextOverlay.lineGap;
  return TextOverlay.topMargin + hookLineCount * lineHeight + TextOverlay.hookSubtextGap;
}

export function prepareOverlayHookLines(raw: string): string[] {
  return wrapOverlayLines(raw, TextOverlay.hookMaxCharsPerLine, TextOverlay.hookMaxLines);
}

export function prepareOverlaySubtextLines(raw: string): string[] {
  return wrapOverlayLines(raw, TextOverlay.subtextMaxChars, 1);
}

function drawTextLine(
  inputLabel: string,
  outputLabel: string,
  text: string,
  fontSize: number,
  y: number,
): string {
  const escaped = escapeDrawText(text);
  const stroke = `:borderw=${TextOverlay.strokeWidth}:bordercolor=black@0.85`;
  return `[${inputLabel}]drawtext=text='${escaped}':fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${y}${stroke}:fix_bounds=1[${outputLabel}]`;
}

export function buildOverlayTextFilters(
  baseLabel: string,
  hookLines: string[],
  subtextLines: string[],
): { filter: string; outputLabel: string } {
  const filters: string[] = [];
  let current = baseLabel;

  for (let i = 0; i < hookLines.length; i++) {
    const isLastHook = i === hookLines.length - 1 && !subtextLines[0];
    const outputLabel = isLastHook ? 'vout' : `withHook${i}`;
    filters.push(
      drawTextLine(
        current,
        outputLabel,
        hookLines[i]!,
        TextOverlay.hookFontSize,
        hookYForLine(i),
      ),
    );
    current = outputLabel;
  }

  const subtext = subtextLines[0];
  if (subtext) {
    filters.push(
      drawTextLine(
        current,
        'vout',
        subtext,
        TextOverlay.subtextFontSize,
        subtextYForHookLineCount(hookLines.length || 1),
      ),
    );
  }

  if (filters.length === 0) {
    return { filter: '', outputLabel: baseLabel };
  }

  return { filter: filters.join(';'), outputLabel: 'vout' };
}

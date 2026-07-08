import type { SearchAssetsResult } from '@ugc/types';
import { ToolNames } from '@ugc/types';
import { randomUUID } from 'node:crypto';
import type { Message } from 'ai';

type SearchAssetsSuccess = Extract<SearchAssetsResult, { ok: true }>;
type PreviewContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string };

export const ASSET_PREVIEW_TEXT_PREFIX = 'Asset previews for your picks.';

export function isAssetPreviewMessage(message: Message): boolean {
  if (message.role !== 'user') return false;
  if (typeof message.id === 'string' && message.id.startsWith('asset-preview-')) return true;

  if (typeof message.content === 'string') {
    return message.content.startsWith(ASSET_PREVIEW_TEXT_PREFIX);
  }

  if (Array.isArray(message.content)) {
    return (message.content as PreviewContentPart[]).some(
      (part) => part.type === 'text' && part.text.startsWith(ASSET_PREVIEW_TEXT_PREFIX),
    );
  }

  const parts = message.parts ?? [];
  return parts.some(
    (part) => part.type === 'text' && part.text.startsWith(ASSET_PREVIEW_TEXT_PREFIX),
  );
}

function getSearchAssetsFromMessage(
  message: Message,
): {
  result: SearchAssetsSuccess;
  gifQuery: string;
  backgroundQuery: string;
  toolCallId: string;
} | null {
  if (message.role !== 'assistant') return null;

  const invocations = [
    ...(message.toolInvocations ?? []),
    ...(message.parts ?? [])
      .filter((part) => part.type === 'tool-invocation')
      .map((part) => part.toolInvocation),
  ];

  for (const invocation of invocations) {
    if (invocation.toolName !== ToolNames.searchAssets || invocation.state !== 'result') continue;
    const result = invocation.result as SearchAssetsResult | undefined;
    if (!result?.ok) continue;
    const args = (invocation.args ?? {}) as { gifQuery?: string; backgroundQuery?: string };
    return {
      result,
      gifQuery: args.gifQuery ?? '',
      backgroundQuery: args.backgroundQuery ?? '',
      toolCallId: invocation.toolCallId,
    };
  }

  return null;
}

export function buildAssetPreviewUserMessage(
  result: SearchAssetsSuccess,
  gifQuery: string,
  backgroundQuery: string,
  previewId = `asset-preview-${randomUUID()}`,
): Message {
  const memes = result.memes.filter((candidate) => candidate.thumbnailUrl).slice(0, 5);
  const backgrounds = result.backgrounds.filter((candidate) => candidate.thumbnailUrl).slice(0, 5);

  const content: PreviewContentPart[] = [
    {
      type: 'text',
      text: `${ASSET_PREVIEW_TEXT_PREFIX} Meme query: "${gifQuery}". Background: "${backgroundQuery}". Use thumbnails + metadata to pick meme, audio, and optionally a background. Choose layout on render_ugc_video: full_bleed (meme fills frame, skip background) or layered (background + centered meme).`,
    },
    { type: 'text', text: 'Meme overlay candidates:' },
    ...memes.flatMap((candidate) => [
      {
        type: 'text' as const,
        text: `${candidate.id} | ${candidate.title ?? candidate.label} | ${candidate.source ?? ''} | ${candidate.durationSec ?? '?'}s | ${candidate.meta ?? ''}`,
      },
      { type: 'image' as const, image: candidate.thumbnailUrl! },
    ]),
    { type: 'text', text: 'Background candidates:' },
    ...backgrounds.flatMap((candidate) => [
      {
        type: 'text' as const,
        text: `${candidate.id} | ${candidate.title ?? candidate.label} | ${candidate.durationSec ?? '?'}s | ${candidate.meta ?? ''}`,
      },
      { type: 'image' as const, image: candidate.thumbnailUrl! },
    ]),
  ];

  return {
    id: previewId,
    role: 'user',
    content: content as unknown as Message['content'],
  };
}

export function injectAssetPreviewMessages(messages: Message[]): Message[] {
  const output: Message[] = [];

  for (const message of messages) {
    output.push(message);
    const search = getSearchAssetsFromMessage(message);
    if (!search) continue;
    const previewId = `asset-preview-${search.toolCallId}`;
    const hasPreviewAhead = messages
      .slice(messages.indexOf(message) + 1)
      .some((candidate) => candidate.id === previewId);
    if (hasPreviewAhead) continue;
    output.push(
      buildAssetPreviewUserMessage(
        search.result,
        search.gifQuery,
        search.backgroundQuery,
        previewId,
      ),
    );
  }

  return output;
}

import {
  ApiRoutes,
  chatRequestSchema,
  isRenderUgcVideoSuccess,
  MessageRoles,
  ToolNames,
  type RenderUgcVideoResult,
  type SearchAssetsResult,
} from '@ugc/types';
import { ChatAgentPrompt, createPipelineTools } from '@ugc/pipeline';
import type { AppContext } from '../context.js';
import {
  buildAssetPreviewUserMessage,
  injectAssetPreviewMessages,
  isAssetPreviewMessage,
} from '../lib/asset-preview-messages.js';
import { formatStreamError, logStreamError } from '../lib/stream-error.js';
import { listThreadMessages } from '../mappers.js';
import { maybeSetThreadTitleFromFirstMessage } from './threads.js';
import { createOpenAI } from '@ai-sdk/openai';
import type { Message } from 'ai';
import { appendResponseMessages, convertToCoreMessages, createDataStreamResponse, streamText } from 'ai';
import { Hono } from 'hono';

const MaxAgentSteps = 8;

function isSearchAssetsSuccess(result: unknown): result is Extract<SearchAssetsResult, { ok: true }> {
  return Boolean(result && typeof result === 'object' && 'ok' in result && result.ok === true);
}

export function createChatRoutes(context: AppContext): Hono {
  const router = new Hono();

  router.post(ApiRoutes.chat, async (c) => {
    const parsed = chatRequestSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const { threadId, messages } = parsed.data;
    const thread = await context.db.getThread(threadId);
    if (!thread) return c.json({ error: 'Thread not found' }, 404);

    const uiMessages = messages as Message[];
    const latestUserMessage = [...uiMessages]
      .reverse()
      .find((message) => message.role === MessageRoles.user && !isAssetPreviewMessage(message));
    if (!latestUserMessage) return c.json({ error: 'User message is required' }, 400);

    const existingMessages = await listThreadMessages(context.db, threadId);
    const lastPersisted = existingMessages.at(-1);
    const isDuplicateUserMessage =
      lastPersisted?.role === MessageRoles.user &&
      lastPersisted.content === latestUserMessage.content;

    if (!isDuplicateUserMessage) {
      await context.db.addMessage({
        threadId,
        role: MessageRoles.user,
        content: latestUserMessage.content,
      });
      await maybeSetThreadTitleFromFirstMessage(context, threadId, latestUserMessage.content);
    }

    const openai = createOpenAI({ apiKey: context.config.openaiApiKey });
    const tools = createPipelineTools({ config: context.config, threadId }, { threadId });

    return createDataStreamResponse({
      onError: formatStreamError,
      execute: async (dataStream) => {
        let messagesState = injectAssetPreviewMessages(uiMessages);
        let finalText = '';
        const allSteps: Array<{ toolResults: Array<{ toolName: string; result?: unknown; args?: unknown }> }> = [];

        for (let stepIndex = 0; stepIndex < MaxAgentSteps; stepIndex++) {
          const result = streamText({
            model: openai(context.config.chatModel),
            system: ChatAgentPrompt,
            messages: convertToCoreMessages(messagesState),
            tools,
            toolChoice: 'auto',
            toolCallStreaming: true,
            maxSteps: 1,
            onError: ({ error }) => {
              logStreamError('chat', error);
            },
          });

          result.mergeIntoDataStream(dataStream);

          const [text, steps, response] = await Promise.all([
            result.text,
            result.steps,
            result.response,
          ]);
          finalText = text;
          allSteps.push(...steps);

          messagesState = appendResponseMessages({
            messages: messagesState,
            responseMessages: response.messages,
          });

          const step = steps.at(-1);
          const searchTool = step?.toolResults?.find(
            (entry) => entry.toolName === ToolNames.searchAssets,
          );
          if (
            searchTool &&
            isSearchAssetsSuccess(searchTool.result) &&
            !messagesState.some((message) => message.id === `asset-preview-${searchTool.toolCallId}`)
          ) {
            const previewId = `asset-preview-${searchTool.toolCallId}`;
            const args = (searchTool.args ?? {}) as {
              gifQuery?: string;
              backgroundQuery?: string;
            };
            messagesState.push(
              buildAssetPreviewUserMessage(
                searchTool.result,
                args.gifQuery ?? '',
                args.backgroundQuery ?? '',
                previewId,
              ),
            );
            continue;
          }

          const hadToolCalls = (step?.toolCalls?.length ?? 0) > 0;
          if (hadToolCalls) continue;

          break;
        }

        await context.db.setThreadUiMessages(
          threadId,
          messagesState as unknown as Record<string, unknown>[],
        );

        const toolResult = allSteps
          .flatMap((step) => step.toolResults)
          .find((entry) => entry.toolName === ToolNames.renderUgcVideo);
        const rawResult =
          toolResult && 'result' in toolResult
            ? (toolResult.result as RenderUgcVideoResult)
            : null;
        const videoOutput =
          rawResult && isRenderUgcVideoSuccess(rawResult) ? rawResult : null;

        const message = await context.db.addMessage({
          threadId,
          role: MessageRoles.assistant,
          content: finalText,
          metadata: videoOutput?.videoUrl
            ? {
                videoUrl: videoOutput.videoUrl,
                hook: videoOutput.hook,
                vibe: videoOutput.vibe,
                toolName: ToolNames.renderUgcVideo,
                sourceUrl: videoOutput.sourceUrl,
              }
            : null,
        });

        if (videoOutput?.videoUrl) {
          await context.db.addGeneration({
            threadId,
            messageId: message.id,
            videoUrl: videoOutput.videoUrl,
            planJson: JSON.stringify({
              trace: videoOutput.trace,
              videoUrl: videoOutput.videoUrl,
              hook: videoOutput.hook,
              vibe: videoOutput.vibe,
              sourceUrl: videoOutput.sourceUrl,
            }),
          });
        }
      },
    });
  });

  return router;
}

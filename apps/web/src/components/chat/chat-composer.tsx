'use client';

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';

type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

interface ChatComposerProps {
  status: ChatStatus;
  onSubmit: (text: string) => void;
}

export function ChatComposer({ status, onSubmit }: ChatComposerProps) {
  const canSubmit = status === 'ready' || status === 'error';

  return (
    <div className="shrink-0 border-t border-border p-4">
      <PromptInput
        className="mx-auto max-w-3xl"
        onSubmit={(message) => {
          const text = message.text.trim();
          if (!text || !canSubmit) return;
          onSubmit(text);
        }}
      >
        <PromptInputBody>
          <PromptInputTextarea placeholder="Describe the vibe or paste a product URL…" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputSubmit
            disabled={!canSubmit}
            status={status === 'error' ? 'ready' : status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

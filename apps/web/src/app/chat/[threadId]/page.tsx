import { ChatThreadPanel } from '@/components/chat/chat-thread-panel';

interface ChatThreadPageProps {
  params: Promise<{ threadId: string }>;
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { threadId } = await params;
  return <ChatThreadPanel threadId={threadId} />;
}

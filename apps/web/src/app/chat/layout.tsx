import type { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export default function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  return (
    <div className="grid h-screen overflow-hidden lg:grid-cols-[280px_1fr]">
      <div className="min-h-0 overflow-hidden">{sidebar}</div>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

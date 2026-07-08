import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SwrProvider } from '@/components/providers/swr-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'UGC Studio',
  description: 'Chat-native UGC video generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body>
        <ThemeProvider>
          <SwrProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

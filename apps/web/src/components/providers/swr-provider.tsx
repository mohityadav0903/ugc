'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

interface SwrProviderProps {
  children: ReactNode;
}

export function SwrProvider({ children }: SwrProviderProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

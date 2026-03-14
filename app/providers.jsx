'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import StoreProvider from '@/app/StoreProvider';

export function Providers({ children }) {
  return (
    <ClerkProvider>
      <StoreProvider>
        <Toaster />
        {children}
      </StoreProvider>
    </ClerkProvider>
  );
}


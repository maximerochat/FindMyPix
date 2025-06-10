// src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { ProcessingProvider } from '@/contexts/ProcessingContext';
import ProcessingQueue from '@/components/ProcessingQueue';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import ModernLayout from '@/components/ModernLayout';

export const metadata = {
  title: 'Event Photo Finder',
  description: 'Find all event photos you appear in',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <SessionProvider session={session}>
          <ProcessingProvider>
            <ModernLayout session={session}>
              {children}
            </ModernLayout>
            <ProcessingQueue />
          </ProcessingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

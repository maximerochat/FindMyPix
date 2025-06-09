// src/app/layout.tsx
import './globals.css'
import Link from 'next/link'
import { ReactNode } from 'react'
import { ProcessingProvider } from '@/contexts/ProcessingContext'
import ProcessingQueue from '@/components/ProcessingQueue'
import { SessionProvider } from "next-auth/react";
import { auth, signOut } from "@/lib/auth";
import { LoginButton } from '@/components/auth/LoginButton'

export const metadata = {
  title: 'Event Photo Finder',
  description: 'Find all event photos you appear in',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <SessionProvider session={session}>
          <ProcessingProvider>
            <header className="border-b bg-card p-4">
              <nav className="container mx-auto flex space-x-6">
                <Link href="/manage" className="font-medium hover:underline">
                  Manage Photos
                </Link>
                <Link href="/search" className="font-medium hover:underline">
                  Find Yourself
                </Link>
                <Link href="/auth/signin" className="font-medium hover:underline">
                  Sign in
                </Link>
                <Link href="/auth/register" className="font-medium hover:underline">
                  Register
                </Link>

                <LoginButton />

              </nav>
            </header>

            {children}

            {/* your floating queue indicator */}
            <ProcessingQueue />
          </ProcessingProvider>
        </SessionProvider>
      </body>
    </html >
  )
}

// src/app/layout.tsx
import './globals.css'
import Link from 'next/link'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Event Photo Finder',
  description: 'Find all event photos you appear in',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <header className="border-b bg-card p-4">
          <nav className="container mx-auto flex space-x-6">
            <Link href="/manage" className="font-medium hover:underline">
              Manage Photos
            </Link>
            <Link href="/search" className="font-medium hover:underline">
              Find Yourself
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}

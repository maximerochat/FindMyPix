'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function SearchPage() {
  const [results] = useState(
    // dummy results
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      src: `https://placehold.co/600x400`,
      location: `Event #${i + 1}`,
    }))
  )

  return (
    <main className="min-h-screen p-8 space-y-12">
      <section className="max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">Find Yourself</h1>
        <p className="text-slate-600">
          Upload a picture of your face and we’ll show you every photo
          where you appear.
        </p>
        <div className="flex justify-center gap-4">
          <Input type="file" accept="image/*" />
          <Button>Search</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Results</h2>
        {results.length === 0 ? (
          <p className="text-muted-foreground">
            Upload a photo to start searching.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((res) => (
              <Card key={res.id}>
                <CardHeader>
                  <CardTitle>{res.location}</CardTitle>
                </CardHeader>
                <CardContent className="relative h-48 w-full">
                  <Image
                    src={res.src}
                    alt={`Match ${res.id + 1}`}
                    fill
                    className="object-cover"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

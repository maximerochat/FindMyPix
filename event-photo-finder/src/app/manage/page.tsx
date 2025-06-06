// src/app/manage/page.tsx
'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

type ImageOut = {
  id: number
  path: string
  embeddings: any[]
}

export default function ManagePage() {
  const [images, setImages] = useState<ImageOut[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch existing images
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:8000/images')
        const data: ImageOut[] = await res.json()
        setImages(data)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  // Handle file selection
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files)
  }

  // Upload selected files
  async function onUpload() {
    if (!files || files.length === 0) return
    setLoading(true)
    const uploaded: ImageOut[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const form = new FormData()
      form.append('file', file)

      try {
        const res = await fetch('http://localhost:8000/images', {
          method: 'POST',
          body: form,
        })
        if (!res.ok) throw new Error(await res.text())
        uploaded.push(await res.json())
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    setImages(prev => [...uploaded, ...prev])
    setFiles(null)
    setLoading(false)
  }

  // Delete an image
  async function onRemove(id: number) {
    if (!confirm('Remove this image?')) return
    try {
      const res = await fetch(`http://localhost:8000/images/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(await res.text())
      setImages(prev => prev.filter(img => img.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen p-8 space-y-12">
      {/* Upload Section */}
      <section>
        <h1 className="text-3xl font-bold mb-4">Manage Photos</h1>
        <Card>
          <CardHeader>
            <CardTitle>Add New Photos</CardTitle>
            <CardDescription>
              Select one or more images to upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
            />
            <Button
              onClick={onUpload}
              disabled={loading || !files || files.length === 0}
            >
              {loading ? 'Uploading…' : 'Add to Gallery'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Gallery Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Existing Photos</h2>
        {images.length === 0 ? (
          <p className="text-muted-foreground">
            No photos in your gallery.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map(img => (
              <div
                key={img.id}
                className="
            relative group overflow-hidden rounded-lg
            h-56 bg-slate-100
            transition-transform duration-300 ease-in-out
            group-hover:scale-105
          "
              >
                {/* Full-cover image */}
                <Image
                  src={`http://localhost:8000/files/${img.path}`}
                  alt={`Photo ${img.id}`}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Hover overlay */}
                <div
                  className="
              absolute inset-0 bg-black/40
              opacity-0 group-hover:opacity-100
              transition-opacity duration-300 ease-in-out
            "
                >
                  <div className="flex justify-between items-start p-2 h-full">
                    {/* ID badge */}
                    <span
                      className="
                  bg-white/20 text-white text-xs px-1 rounded
                  transition-colors duration-200 ease-in-out
                "
                    >
                      #{img.id}
                    </span>

                    {/* Trash button */}
                    <button
                      onClick={() => onRemove(img.id)}
                      className="
                  bg-white/20 p-1 rounded
                  transition-colors duration-100 ease-in-out
                  hover:bg-red-600/40 hover:bg-opacity-80
                "
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

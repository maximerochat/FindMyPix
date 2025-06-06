// src/app/manage/page.tsx
'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { useProcessingQueue } from '@/contexts/ProcessingContext'
import ImageGallery from '@/components/ImageGallery'

type ImageOut = {
  id: number
  path: string
  embeddings: any[]
}

export default function ManagePage() {
  const { add, done, remove } = useProcessingQueue()
  const [images, setImages] = useState<ImageOut[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('http://localhost:8000/images')
      .then((r) => r.json())
      .then(setImages)
      .catch(console.error)
  }, [])

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files)
  }

  async function onUpload() {
    if (!files?.length) return
    setLoading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const taskId = `${file.name}-${Date.now()}`
      add({ id: taskId, label: file.name })

      const form = new FormData()
      form.append('file', file)

      try {
        const res = await fetch('http://localhost:8000/images', {
          method: 'POST',
          body: form,
        })
        if (!res.ok) throw new Error(await res.text())
        const img: ImageOut = await res.json()
        setImages((p) => [img, ...p])
        done(taskId)
      } catch (err) {
        console.error(err)
        remove(taskId)
      }
    }

    setFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setLoading(false)
  }

  async function onRemove(id: number) {
    if (!confirm('Remove this image?')) return
    await fetch(`http://localhost:8000/images/${id}`, {
      method: 'DELETE',
    })
    setImages((p) => p.filter((i) => i.id !== id))
  }

  return (
    <main className="min-h-screen p-8 space-y-12">
      {/* Upload */}
      <section>
        <h1 className="text-3xl font-bold mb-4">Manage Photos</h1>
        <div className="flex gap-4 items-center">
          <Input ref={fileInputRef} type="file" multiple accept="image/*" onChange={onFileChange} />
          <Button onClick={onUpload} disabled={loading || !files?.length}>
            {loading ? 'Uploading…' : 'Add to Gallery'}
          </Button>
        </div>
      </section>

      {/* Gallery */}

      <ImageGallery
        title="Existing Pictures"
        images={images}
        emptyMessage='No photos in your gallery.'
        onRemove={onRemove}
      />
    </main>
  )
}

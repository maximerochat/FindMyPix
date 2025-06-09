// src/app/manage/page.tsx
'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProcessingQueue } from '@/contexts/ProcessingContext'
import ImageGallery from '@/components/ImageGallery'
import { ImageOut } from "@/api/types"
import apiClient from '@/lib/axios'
import { ClientAuthGuard } from '@/components/auth/ClientAuthGuard'
import axios from 'axios'

export default function ManagePage() {
  const { add, done, remove } = useProcessingQueue()
  const [images, setImages] = useState<ImageOut[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    apiClient.get('/images')
      .then((r) => r.data)
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
        // POST to /images (→ http://localhost:8000/images)
        const response = await apiClient.post<ImageOut>("/images", form);

        // response.data is already your parsed ImageOut
        setImages((prev) => [response.data, ...prev]);
        done(taskId);
      } catch (err: unknown) {
        console.error(err);

        // If it was an Axios error, pull out message/detail
        if (axios.isAxiosError(err)) {
          const detail =
            (err.response?.data as any)?.detail ??
            (err.response?.data as any)?.message;
          console.error("Upload failed:", detail);
        }

        remove(taskId);
      }
    }

    setFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setLoading(false)
  }


  async function onRemove(id: number) {
    if (!confirm("Remove this image?")) return;

    try {
      // DELETE http://localhost:8000/images/{id}
      await apiClient.delete(`/images/${id}`);

      // remove from local state
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as any)?.detail ??
          (err.response?.data as any)?.message;
        alert(detail ?? "Failed to remove image.");
      } else {
        alert((err as Error).message);
      }
    }
  }

  return (
    <ClientAuthGuard>
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
    </ClientAuthGuard>
  )
}

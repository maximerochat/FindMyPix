'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// No longer need Card, CardHeader, CardTitle, CardContent directly in this file
// if ImageGallery replaces them for results display
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useProcessingQueue } from '@/contexts/ProcessingContext'
import { v4 as uuidv4 } from 'uuid'
import { Loader2 } from 'lucide-react'
// Import the new ImageGallery component and its type
import ImageGallery, { GalleryImage } from '@/components/ImageGallery'


// Define the shape of a match result based on your FastAPI MatchResult model
// Now correctly includes image_path
interface MatchResult {
  embedding_id: number
  image_id: number
  image_path: string // <--- This is the key addition!
  distance: number
  threshold: number
  bbox: {
    x: number
    y: number
    w: number
    h: number
  }
}

export default function SearchPage() {
  const { add, done, remove: removeFromQueue } = useProcessingQueue() // Renamed remove to removeFromQueue
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [results, setResults] = useState<MatchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
      setError(null) // Clear any previous errors
    } else {
      setSelectedFile(null)
    }
  }

  const handleSearch = async () => {
    if (!selectedFile) {
      setError('Please select an image file to search.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([]) // Clear previous results

    const formData = new FormData()
    formData.append('file', selectedFile)

    const processingId = uuidv4()
    add({ id: processingId, label: `Uploading ${selectedFile.name}...` })

    try {
      const response = await fetch('http://localhost:8000/match', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to match image.')
      }

      const data: MatchResult[] = await response.json()
      setResults(data)
      done(processingId)
    } catch (err: any) {
      console.error('Error during image matching:', err)
      setError(err.message || 'An unexpected error occurred during search.')
      removeFromQueue(processingId) // Remove the item if there was an error
    } finally {
      setIsLoading(false)
      setSelectedFile(null); // Clear the selected file input
    }
  }

  // Transform backend results into the format required by ImageGallery
  const galleryImages: GalleryImage[] = results.map((res) => ({
    id: res.image_id,   // Use image_id as the primary ID for the gallery item
    path: res.image_path, // Directly use the image_path from the backend
    // You could also add `embedding_id` or `distance` here if the gallery
    // needed to display them, but it's not currently set up for that.
  }));

  // Determine the empty message for the ImageGallery dynamically
  const galleryEmptyMessage = isLoading
    ? 'Searching for matches...'
    : error
      ? 'No results due to an error. Please try again.'
      : selectedFile && !isLoading && galleryImages.length === 0
        ? 'No matches found for the uploaded image.'
        : 'Upload a photo to start searching. Results will appear here.';


  return (
    <main className="min-h-screen p-8 space-y-12">
      <section className="max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">Find Yourself</h1>
        <p className="text-slate-600">
          Upload a picture of your face and we’ll show you every photo
          where you appear.
        </p>
        <div className="flex justify-center gap-4">
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          <Button onClick={handleSearch} disabled={isLoading || !selectedFile}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </section>

      {/* Use the ImageGallery component for displaying search results */}
      <ImageGallery
        title="Results"
        images={galleryImages}
        emptyMessage={galleryEmptyMessage}
      // onRemove prop is not passed here as search results are not meant to be removed from the gallery
      />
    </main>
  )
}

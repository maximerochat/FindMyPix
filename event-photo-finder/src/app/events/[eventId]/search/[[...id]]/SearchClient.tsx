'use client';

import axios from 'axios';
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useProcessingQueue } from '@/contexts/ProcessingContext';
import ImageGallery from '@/components/ImageGallery';
import { MatchResult, ImageOut } from '@/api/types';
import apiClient from '@/lib/axios';

interface SearchClientProps {
  faceId: string | null;
  eventId: number;
}

export default function SearchClient({ faceId, eventId }: SearchClientProps) {
  const { add, done, remove: removeFromQueue } = useProcessingQueue();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // this ref prevents double-running even under StrictMode
  const didSearchRef = useRef(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    if (f) setError(null);
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      setError('Please select an image file to search.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const procId = uuidv4();
    add({ id: procId, label: `Uploading ${selectedFile.name}…` });

    try {
      // Axios will detect FormData and set the correct Content-Type header
      const response = await apiClient.post<MatchResult[]>(
        `/match/${eventId}`,
        formData,
      );

      // response.data is already parsed JSON
      setResults(response.data);
      done(procId);
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        // Try to pull a `detail` or `message` field from the error response
        const detail =
          (err.response?.data as any)?.detail ||
          (err.response?.data as any)?.message;
        setError(detail ?? 'Failed to match image.');
      } else {
        setError((err as Error).message ?? 'Unexpected error.');
      }

      removeFromQueue(procId);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const handleSearchById = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    const procId = uuidv4();
    add({ id: procId, label: `Looking at embedding #${id}` });

    try {
      // if your apiClient.baseURL === "http://localhost:8000",
      // you can just do `/match/${id}` here
      const response = await apiClient.get<MatchResult[]>(
        `/match/${eventId}/${id}`,
      );

      // axios unwraps JSON into `response.data`
      setResults(response.data);
      done(procId);
    } catch (err: unknown) {
      console.error(err);

      // AxiosError guard
      if (axios.isAxiosError(err)) {
        // server responded with a body
        const detail =
          (err.response?.data as any)?.detail ??
          // some APIs might use `.message`
          (err.response?.data as any)?.message;
        setError(detail ?? 'Failed to match image.');
      } else {
        // non-Axios error
        setError((err as Error).message || 'Unexpected error.');
      }

      removeFromQueue(procId);
    } finally {
      setIsLoading(false);
    }
  };

  // on first mount, if a faceId came from the URL, run that search once
  useEffect(() => {
    if (!faceId || didSearchRef.current) return;
    didSearchRef.current = true;
    handleSearchById(faceId);
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceId]);

  // map to the gallery’s Image type
  const galleryImages: ImageOut[] = results.map((r) => ({
    id: r.image_id,
    path: r.image_path,
    embeddings: r.other_embeddings,
    bbox: r.bbox,
  }));

  const emptyMessage = isLoading
    ? 'Searching…'
    : error
      ? 'Error – try again.'
      : selectedFile && !isLoading && galleryImages.length === 0
        ? 'No matches found.'
        : 'Upload a photo or select a face above.';

  return (
    <main className="min-h-screen p-8 space-y-12">
      {/* Upload form */}
      <section className="max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">Find Yourself</h1>
        <div className="flex justify-center gap-4">
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          <Button onClick={handleSearch} disabled={isLoading || !selectedFile}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </section>

      {/* Results gallery */}
      <ImageGallery
        title="Results"
        eventId={eventId}
        images={galleryImages}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}

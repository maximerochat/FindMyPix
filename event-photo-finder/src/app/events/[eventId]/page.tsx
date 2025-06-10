'use client';

import { useState, useEffect, ChangeEvent, use } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'next/navigation';
import axios from 'axios';

import apiClient from '@/lib/axios';
import { EventOut, MatchResult, ImageOut } from '@/api/types';
import { useProcessingQueue } from '@/contexts/ProcessingContext';
import ImageGallery from '@/components/ImageGallery';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';

interface PageProps {
  eventId: number;
}

export default function EventDetailPage({
  // Next.js may give you a Promise here
  params,
}: {
  params: Promise<PageProps>;
}) {
  const { eventId } = use(params);

  console.log(eventId);

  const { add, done, remove: removeFromQueue } = useProcessingQueue();

  // Event data
  const [event, setEvent] = useState<EventOut | null>(null);
  const [eventImages, setEventImages] = useState<ImageOut[]>([]);

  // Search state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchResults, setSearchResults] = useState<MatchResult[] | null>(
    null,
  );
  const [activeFaceId, setActiveFaceId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Loading states
  const [eventLoading, setEventLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Load event details
  useEffect(() => {
    if (!eventId) return;

    apiClient
      .get<EventOut>(`/events/${eventId}`)
      .then((res) => {
        setEvent(res.data);
        setEventLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load event:', err);
        setEventLoading(false);
      });
  }, [eventId]);

  // Load event images
  useEffect(() => {
    if (!eventId) return;

    apiClient
      .get<ImageOut[]>(`/images/${eventId}`)
      .then((res) => {
        setEventImages(res.data);
        setImagesLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load event images:', err);
        setImagesLoading(false);
      });
  }, [eventId]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setSearchError(null);
      setSearchResults(null);
    }
  };

  const handleImageSearch = async () => {
    if (!selectedFile) {
      setSearchError('Please select an image file to search.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setActiveFaceId(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const procId = uuidv4();
    add({ id: procId, label: `Searching in event with ${selectedFile.name}…` });

    try {
      const response = await apiClient.post<MatchResult[]>(
        `/match/${eventId}`,
        formData,
      );
      setSearchResults(response.data);
      done(procId);
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as any)?.detail ||
          (err.response?.data as any)?.message;
        setSearchError(detail ?? 'Failed to search image.');
      } else {
        setSearchError((err as Error).message ?? 'Unexpected error.');
      }

      removeFromQueue(procId);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFaceSearch = async (faceId: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedFile(null);
    setActiveFaceId(faceId);

    const procId = uuidv4();
    add({ id: procId, label: `Searching by face #${faceId}…` });

    try {
      const response = await apiClient.get<MatchResult[]>(
        `/match/${eventId}/${faceId}`,
        {
          params: { event_id: eventId },
        },
      );
      setSearchResults(response.data);
      done(procId);
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as any)?.detail ||
          (err.response?.data as any)?.message;
        setSearchError(detail ?? 'Failed to search by face.');
      } else {
        setSearchError((err as Error).message ?? 'Unexpected error.');
      }

      removeFromQueue(procId);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSelectedFile(null);
    setSearchResults(null);
    setActiveFaceId(null);
    setSearchError(null);
    // Reset file input
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const isSearchActive = activeFaceId !== null || searchResults !== null;

  // Determine which images to show
  const displayImages: ImageOut[] =
    isSearchActive && searchResults
      ? searchResults.map((r) => ({
          id: r.image_id,
          path: r.image_path,
          embeddings: r.other_embeddings,
          bbox: r.bbox,
        }))
      : eventImages;

  const galleryTitle = isSearchActive ? 'Search Results' : 'Event Photos';
  const emptyMessage = isSearching
    ? 'Searching…'
    : searchError
      ? 'Error – try again.'
      : isSearchActive && displayImages.length === 0
        ? 'No matches found in this event.'
        : !isSearchActive && displayImages.length === 0
          ? 'No photos in this event yet.'
          : '';

  if (eventLoading) {
    return <div className="p-8">Loading event...</div>;
  }

  if (!event) {
    return <div className="p-8">Event not found.</div>;
  }

  return (
    <main className="min-h-screen p-8 space-y-8">
      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {format(new Date(event.date), 'PPP')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {event.description || <em>No description</em>}
          </p>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search in Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSearching}
              />
            </div>
            <Button
              onClick={handleImageSearch}
              disabled={isSearching || !selectedFile}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Active Search Indicators */}
          {(isSearchActive || selectedFile) && (
            <div className="flex flex-wrap gap-2 items-center">
              {selectedFile && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>Searching with: {selectedFile.name}</span>
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {activeFaceId && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span>Searching by face #{activeFaceId}</span>
                  <button
                    onClick={clearSearch}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="ml-auto"
              >
                Clear Search
              </Button>
            </div>
          )}

          {searchError && <p className="text-red-500 text-sm">{searchError}</p>}
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <ImageGallery
        title={galleryTitle}
        images={displayImages}
        emptyMessage={emptyMessage}
        eventId={eventId}
        onFaceClick={handleFaceSearch}
      />
    </main>
  );
}

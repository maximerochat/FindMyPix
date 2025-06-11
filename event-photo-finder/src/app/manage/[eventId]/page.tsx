// src/app/manage/page.tsx
'use client';

import { useState, useEffect, useRef, ChangeEvent, use } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { useProcessingQueue } from '@/contexts/ProcessingContext';
import ImageGallery from '@/components/ImageGallery';
import { ImageOut, EventOut } from '@/api/types';
import apiClient from '@/lib/axios';
import { ClientAuthGuard } from '@/components/auth/ClientAuthGuard';
import axios from 'axios';

interface PageProps {
  eventId: number;
}

export default function ManagePage({
  // Next.js may give you a Promise here
  params,
}: {
  params: Promise<PageProps>;
}) {
  const { eventId } = use(params);
  const { add, done, remove } = useProcessingQueue();

  //
  // 1) EVENT DETAILS STATE & FETCH/UPDATE
  //
  const [event, setEvent] = useState<(EventOut & { title?: string }) | null>(
    null,
  );
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorEvent, setErrorEvent] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<EventOut & { title?: string }>(`/events/${eventId}`)
      .then((res) => {
        const e = res.data;
        setEvent(e);
        setTitle(e.title ?? '');
        setDescription(e.description ?? '');
        setDate(new Date(e.date));
      })
      .catch(console.error);
  }, [eventId]);

  const handleSaveDetails = async () => {
    if (!title || !date) {
      setErrorEvent('Title and date are required.');
      return;
    }
    setSaving(true);
    setErrorEvent(null);

    try {
      const payload = {
        title,
        date: date.toISOString(),
        description,
      };
      const res = await apiClient.put<EventOut & { title?: string }>(
        `/events/${eventId}`,
        payload,
      );
      setEvent(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorEvent(
        err.response?.data?.detail || err.message || 'Update failed',
      );
    } finally {
      setSaving(false);
    }
  };

  //
  // 2) IMAGE UPLOAD STATE & HANDLERS
  //
  const [images, setImages] = useState<ImageOut[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<ImageOut[]>(`/images/${eventId}`)
      .then((r) => r.data)
      .then(setImages)
      .catch(console.error);
  }, [eventId]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files);
  }

  async function onUpload() {
    if (!files?.length) return;
    setLoading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const taskId = `${file.name}-${Date.now()}`;
      add({ id: taskId, label: file.name });

      const form = new FormData();
      form.append('file', file);

      try {
        const response = await apiClient.post<ImageOut>(
          `/images/${eventId}`,
          form,
        );
        setImages((prev) => [response.data, ...prev]);
        done(taskId);
      } catch (err: unknown) {
        console.error(err);
        if (axios.isAxiosError(err)) {
          const detail =
            (err.response?.data as any)?.detail ||
            (err.response?.data as any)?.message;
          console.error('Upload failed:', detail);
        }
        remove(taskId);
      }
    }

    setFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);
  }

  //
  // 3) IMAGE REMOVE HANDLER
  //
  async function onRemove(id: number) {
    if (!confirm('Remove this image?')) return;
    try {
      await apiClient.delete(`/images/${id}`);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as any)?.detail ||
          (err.response?.data as any)?.message;
        alert(detail ?? 'Failed to remove image.');
      } else {
        alert((err as Error).message);
      }
    }
  }

  return (
    <ClientAuthGuard>
      <main className="min-h-screen p-8 space-y-12">
        {/* ———————————————— 1) Edit Event Details ———————————————— */}
        <section>
          <h1 className="text-3xl font-bold mb-4">Edit Event Details</h1>
          <Card>
            <CardHeader>
              <CardTitle>Event Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="event-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {date ? format(date, 'PPP') : 'Pick a date'}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => setDate(d ?? undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="event-desc">Description</Label>
                <Textarea
                  id="event-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {errorEvent && (
                <p className="text-sm text-red-500">{errorEvent}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveDetails} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* ———————————————— 2) Upload New Photos ———————————————— */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Manage Photos</h2>
          <div className="flex gap-4 items-center">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={onFileChange}
            />
            <Button onClick={onUpload} disabled={loading || !files?.length}>
              {loading ? 'Uploading…' : 'Add to Gallery'}
            </Button>
          </div>
        </section>

        {/* ———————————————— 3) Existing Gallery ———————————————— */}
        <ImageGallery
          title="Existing Pictures"
          images={images}
          eventId={eventId}
          emptyMessage="No photos in your gallery."
          onRemove={onRemove}
        />
      </main>
    </ClientAuthGuard>
  );
}

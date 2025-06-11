'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import apiClient from '@/lib/axios';
import { EventOut, EventIn } from '@/api/types';
import { useProcessingQueue } from '@/contexts/ProcessingContext';

import { DataTable } from './data-table';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';

// Icons
import { Plus, CalendarIcon } from 'lucide-react';

async function getData(): Promise<EventOut[]> {
  try {
    const response = await apiClient.get<EventOut[]>('/events/my');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { add, done } = useProcessingQueue();

  // State
  const [events, setEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);

  // Create event dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [description, setDescription] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    if (status === 'loading') return;
    else if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        const data = await getData();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [status, router]);

  const handleDelete = async (id: number) => {
    setLoading(true);
    const task = uuidv4();
    add({ id: task, label: 'Deleting event…' });
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error(err);
      // Handle error appropriately
    } finally {
      done(task);
      setLoading(false);
    }
  };

  const columns = createColumns(handleDelete, loading, router);

  const handleCreateEvent = async () => {
    if (!date) {
      setCreateError('Please select a date');
      return;
    }

    setCreating(true);
    setCreateError(null);
    const taskId = uuidv4();
    add({ id: taskId, label: 'Creating event...' });

    try {
      const payload: EventIn = {
        title: title.trim(),
        date: date.toISOString(),
        description: description.trim(),
      };

      const response = await apiClient.post<EventOut>('/events', payload);
      setEvents((prev) => [response.data, ...prev]);

      // Reset form
      setDate(undefined);
      setDescription('');
      setDialogOpen(false);

      done(taskId);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.response?.data?.detail || 'Failed to create event');
      done(taskId);
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center py-4">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-10 w-20 ml-auto" />
              </div>
              <div className="rounded-md border">
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground">Manage events you've created</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event description..."
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
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
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description..."
                />
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <DataTable columns={columns} data={events} />
        </CardContent>
      </Card>
    </div>
  );
}

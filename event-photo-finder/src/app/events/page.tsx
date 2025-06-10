'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import apiClient from '@/lib/axios';
import { EventIn, EventOut } from '@/api/types';
import { useProcessingQueue } from '@/contexts/ProcessingContext';
import { DeleteEventButton } from '@/components/DeleteEventButton';
// shadcn/ui components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<EventOut[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { add, done, remove } = useProcessingQueue();

  // load events on mount
  useEffect(() => {
    apiClient
      .get<EventOut[]>('/events')
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
  }, []);

  // create a new event
  const handleCreate = async () => {
    if (!date) {
      setError('Please pick a date');
      return;
    }
    setError(null);
    setLoading(true);
    const task = uuidv4();
    add({ id: task, label: 'Creating event…' });

    try {
      const payload: EventIn = {
        date: date.toISOString(),
        description: description.trim(),
      };
      const res = await apiClient.post<EventOut>('/events', payload);
      setEvents((prev) => [res.data, ...prev]);
      setDate(undefined);
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to create');
    } finally {
      done(task);
      setLoading(false);
    }
  };

  // delete an event
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    setLoading(true);
    const task = uuidv4();
    add({ id: task, label: 'Deleting event…' });
    try {
      await apiClient.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Delete failed');
    } finally {
      done(task);
      setLoading(false);
    }
  };

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Events</h1>

      {/* Create Event Form */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  onSelect={setDate}
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
              placeholder="Optional details…"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Saving…' : 'Create Event'}
          </Button>
        </CardFooter>
      </Card>

      {/* List of Events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <Card key={evt.id} onClick={() => router.push(`/manage/${evt.id}`)}>
            <CardHeader>
              <CardTitle>{format(new Date(evt.date), 'PPP')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {evt.description || <em>No description</em>}
              </p>
            </CardContent>
            {evt && evt.is_owner && (
              <CardFooter className="flex justify-end">
                <DeleteEventButton
                  disabled={loading}
                  onConfirm={() => handleDelete(evt.id)}
                />
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}

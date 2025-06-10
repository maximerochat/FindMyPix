'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { EventOut } from '@/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<EventOut[]>('/events')
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load events');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-8">Loading events…</p>;
  }

  if (error) {
    return <p className="p-8 text-red-500">Error: {error}</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">All Events</h1>
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <Card
              key={evt.id}
              className="cursor-pointer"
              onClick={() => router.push(`/events/${evt.id}`)}
            >
              <CardHeader>
                <CardTitle>{format(new Date(evt.date), 'PPP')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {evt.description || <em>No description</em>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

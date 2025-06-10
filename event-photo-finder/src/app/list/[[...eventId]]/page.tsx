'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { EventOut } from '@/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    return (
      <main className="min-h-screen p-8 space-y-8">
        {/* Event Information Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        {/* Search Section Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
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

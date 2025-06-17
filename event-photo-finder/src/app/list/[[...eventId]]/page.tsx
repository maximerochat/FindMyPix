'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import apiClient from '@/lib/axios';
import { EventOut } from '@/api/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventOut[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log("Here")
    console.log(apiClient)
    apiClient
      .get<EventOut[]>('/events')
      .then((res) => {
        setEvents(res.data);
        console.log("HOLA")
        console.log(res.data)
        console.log(res.config)
        console.log(process.env.NEXT_PUBLIC_EXTERNAL_API,)
        setFilteredEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load events');
        setLoading(false);
      });
  }, []);

  // Filter events based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) => {
        const searchLower = searchQuery.toLowerCase();
        const title = (event as any).title || '';
        const description = event.description || '';
        const dateStr = format(new Date(event.date), 'PPP');

        return (
          title.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          dateStr.toLowerCase().includes(searchLower)
        );
      });
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  if (loading) {
    return (
      <main className="container mx-auto min-h-screen p-8 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-80" />
          </div>
        </div>

        {/* Events Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">All Events</h1>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8 space-y-6">
      {/* Header with Search */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">All Events</h1>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search events by title, description, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Found {filteredEvents.length} event
            {filteredEvents.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <div className="space-y-2">
              <p className="text-lg">No events found matching your search.</p>
              <p className="text-muted-foreground">
                Try adjusting your search terms or{' '}
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:underline"
                >
                  clear the search
                </button>
                .
              </p>
            </div>
          ) : (
            <p className="text-lg">No events found.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents && filteredEvents.map((evt) => (
            <Card
              key={evt.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/events/${evt.id}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  {(evt as any).title || format(new Date(evt.date), 'PPP')}
                </CardTitle>
                {(evt as any).title && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(evt.date), 'PPP')}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
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

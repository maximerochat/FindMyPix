// app/search/[[...id]]/page.tsx
import SearchClient from './SearchClient';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface PageProps {
  params: { id?: string[]; eventId: number };
}

export default function SearchPage({ params }: PageProps) {
  // server‐side, params.id is ready synchronously
  const faceId = params.id?.[0] ?? null;
  const eventId = params.eventId;
  // hand off to the client component
  return (
    <AuthGuard>
      <SearchClient faceId={faceId} eventId={eventId} />
    </AuthGuard>
  );
}

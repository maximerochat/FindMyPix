import { AuthGuard } from '@/components/auth/AuthGuard';

interface PageProps {
  params: { id?: string[] };
}

export default function SearchPage({ params }: PageProps) {
  // server‐side, params.id is ready synchronously
  const faceId = params.id?.[0] ?? null;

  // hand off to the client component
  return (
    <AuthGuard>
      <></>
    </AuthGuard>
  );
}

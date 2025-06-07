// app/search/[[...id]]/page.tsx
import SearchClient from './SearchClient'

interface PageProps {
  params: { id?: string[] }
}

export default function SearchPage({ params }: PageProps) {
  // server‐side, params.id is ready synchronously
  const faceId = params.id?.[0] ?? null

  // hand off to the client component
  return <SearchClient faceId={faceId} />
}

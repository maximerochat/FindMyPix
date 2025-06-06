// app/page.tsx
import Image from 'next/image'
import {
  Button,
  buttonVariants,
} from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <section className="container mx-auto py-20 text-center">
        <h1 className="text-5xl font-extrabold text-slate-900">
          Event Photo Finder
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          Upload a face snapshot and find every event photo you appear in.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Browse Events</Button>
        </div>
      </section>

      {/* Feature + Upload Card */}
      <section className="container mx-auto py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            How it works
          </h2>
          <ul className="mt-6 space-y-4 text-slate-700">
            <li>1. Select your event.</li>
            <li>2. Upload a clear face image.</li>
            <li>3. See every photo you’re in, instantly.</li>
          </ul>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Find Your Photos</CardTitle>
            <CardDescription>
              Upload a headshot and we’ll match it across event galleries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="file" accept="image/*" />
          </CardContent>
          <CardFooter>
            <Button className="w-full">Upload & Search</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-100">
        <div className="container mx-auto text-center text-sm text-slate-600">
          © {new Date().getFullYear()} Event Photo Finder. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

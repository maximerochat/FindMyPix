'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Search,
  Users,
  Zap,
  ArrowRight,
  Calendar,
  Upload,
  Shield,
  Star,
  CheckCircle,
  PlayCircle,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/axios';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ events: 0, photos: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load some basic stats for the homepage
    Promise.allSettled([
      apiClient.get('/stats/events'),
      apiClient.get('/stats/photos'),
      apiClient.get('/stats/users'),
    ])
      .then((results) => {
        const newStats = {
          events:
            results[0].status === 'fulfilled' ? results[0].value.data.count : 0,
          photos:
            results[1].status === 'fulfilled' ? results[1].value.data.count : 0,
          users:
            results[2].status === 'fulfilled' ? results[2].value.data.count : 0,
        };
        setStats(newStats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const features = [
    {
      icon: Camera,
      title: 'Smart Photo Recognition',
      description:
        'Upload a photo and instantly find all events where you appear. Our AI-powered face recognition does the heavy lifting.',
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description:
        'Create and manage photo events effortlessly. Perfect for weddings, parties, conferences, and gatherings.',
      color: 'bg-green-500',
    },
    {
      icon: Search,
      title: 'Lightning Fast Search',
      description:
        'Find yourself in thousands of photos within seconds. Search by face, event, or date with ease.',
      color: 'bg-purple-500',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description:
        'Your photos and data are secure. We prioritize privacy with enterprise-grade security measures.',
      color: 'bg-orange-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Wedding Photographer',
      content:
        'This app revolutionized how I share photos with clients. They can instantly find all their photos!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Event Organizer',
      content:
        'Perfect for our corporate events. Attendees love being able to find themselves in group photos.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'Party Enthusiast',
      content:
        "Found myself in 50+ photos from last weekend's festival. This app is magic!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="mx-auto">
              🎉 New: AI-Powered Face Recognition
            </Badge>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Find Yourself in
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}
                Every Photo
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-gray-600 leading-8">
              Never miss a moment again. Upload a selfie and instantly discover
              all the event photos you appear in. Perfect for weddings, parties,
              conferences, and any gathering.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {status === 'loading' ? (
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ) : session ? (
                <div className="flex gap-4">
                  <Button size="lg" onClick={() => router.push('/events')}>
                    <Search className="mr-2 h-5 w-5" />
                    Find Your Face
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/my-events')}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create an Event
                  </Button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button size="lg" asChild>
                    <Link href="/auth/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/auth/signin">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Sign In
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 max-w-md mx-auto">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                ))
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.events.toLocaleString()}+
                    </div>
                    <div className="text-sm text-gray-600">Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.photos.toLocaleString()}+
                    </div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.users.toLocaleString()}+
                    </div>
                    <div className="text-sm text-gray-600">Happy Users</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Our advanced AI technology makes finding yourself in photos
              effortless and instant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Three Simple Steps
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Get started in minutes and never lose track of your photos again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">1. Upload Your Photo</h3>
              <p className="text-gray-600">
                Simply upload a clear photo of yourself. Our AI will create a
                secure facial signature.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">2. Instant Recognition</h3>
              <p className="text-gray-600">
                Our advanced AI scans through thousands of event photos in
                seconds to find you.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">3. Discover & Download</h3>
              <p className="text-gray-600">
                View all photos you appear in, organized by event. Download or
                share instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Loved by Thousands
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              See what our users are saying about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Yourself?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who never miss a photo again.
          </p>

          {status === 'loading' ? (
            <Skeleton className="h-12 w-40 mx-auto" />
          ) : session ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push('/events')}
            >
              <Search className="mr-2 h-5 w-5" />
              Find Your Face Now
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Photo Finder</h3>
              <p className="text-gray-400">
                The smartest way to find yourself in event photos.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-gray-400">
                <Link href="/events" className="block hover:text-white">
                  Find Photos
                </Link>
                <Link href="/events" className="block hover:text-white">
                  Browse Events
                </Link>
                <Link href="/my-events" className="block hover:text-white">
                  My Events
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white">
                  About
                </a>
                <a href="#" className="block hover:text-white">
                  Privacy
                </a>
                <a href="#" className="block hover:text-white">
                  Terms
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-gray-400">
                <a href="#" className="block hover:text-white">
                  Help Center
                </a>
                <a href="#" className="block hover:text-white">
                  Contact
                </a>
                <a href="#" className="block hover:text-white">
                  Status
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Event Photo Finder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

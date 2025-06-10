'use client';

import axios from 'axios';
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useProcessingQueue } from '@/contexts/ProcessingContext';
import ImageGallery from '@/components/ImageGallery';
import { MatchResult, ImageOut } from '@/api/types';
import apiClient from '@/lib/axios';

interface SearchClientProps {
  faceId: string | null;
}

export default function SearchClient({ faceId }: SearchClientProps) {
  return <div>Here we are </div>;
}

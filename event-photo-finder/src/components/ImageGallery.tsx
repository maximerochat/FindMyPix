// src/components/ImageGallery.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOut } from '@/api/types';

import { Trash2, Download, X, ExternalLink, WifiHigh } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: ImageOut[];
  title: string;
  emptyMessage: string;
  onRemove?: (id: number) => void;
  onDownload?: (imagePath: string, imageId: number) => void;
}

export default function ImageGallery({
  images,
  title,
  emptyMessage,
  onRemove,
  onDownload,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageOut | null>(null);
  const [imageSize, setImageSize] = useState<number | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(null);
  const [faceThumbs, setFaceThumbs] = useState<
    { id: number; dataUrl: string }[]
  >([]);

  const getImageUrl = (imagePath: string) =>
    `http://localhost:8000/files/${imagePath}`;
  useEffect(() => {
    if (!selectedImage) {
      setImageSize(null);
      setSelectedFaceId(null);
      return;
    }
  }, [selectedImage]);
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (!selectedImage) {
      setImageSize(null);
      setFaceThumbs([]);
      return;
    }
    fetch(getImageUrl(selectedImage.path), { method: 'HEAD' })
      .then((res) => {
        const len = res.headers.get('content-length');
        if (len) setImageSize(parseInt(len, 10));
        else setImageSize(null);
      })
      .catch(() => setImageSize(null));

    // ---- NEW: crop faces into small data-urls ----
    if (selectedImage.embeddings && selectedImage.embeddings.length) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(selectedImage.path);
      img.onload = () => {
        const thumbs = selectedImage
          .embeddings!.map((emb) => {
            // crop region emb.x,emb.y,emb.w,emb.h
            const circle_padding = 0.03 * img.width;

            const canvas = document.createElement('canvas');
            const width = emb.w + circle_padding;
            const height = emb.h + circle_padding;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(
              img,
              emb.x - circle_padding / 2,
              emb.y - circle_padding / 2,
              width,
              height,
              0,
              0,
              width,
              height,
            );
            // export small data-url
            return { id: emb.id, dataUrl: canvas.toDataURL('image/jpeg') };
          })
          .filter((x): x is { id: number; dataUrl: string } => !!x);
        setFaceThumbs(thumbs);
      };
      img.onerror = () => setFaceThumbs([]);
    }
  }, [selectedImage]);
  useEffect(() => {
    if (!selectedImage) {
      setImageSize(null);
      return;
    }
    const url = getImageUrl(selectedImage.path);
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        const len = res.headers.get('content-length');
        if (len) setImageSize(parseInt(len, 10));
        else setImageSize(null);
      })
      .catch(() => setImageSize(null));
  }, [selectedImage]);

  const handleDownloadClick = async (
    e: React.MouseEvent,
    imagePath: string,
    imageId: number,
  ) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(imagePath, imageId);
      return;
    }
    try {
      const res = await fetch(getImageUrl(imagePath));
      if (!res.ok) throw new Error(res.statusText);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imagePath.split('/').pop() || `image-${imageId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download image');
    }
  };

  const handleOpenNewTab = (e: React.MouseEvent, imagePath: string) => {
    e.stopPropagation();
    window.open(getImageUrl(imagePath), '_blank');
  };

  return (
    <>
      <section>
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        {images.length === 0 ? (
          <p className="text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="
                  relative group overflow-hidden rounded-lg
                  h-56 bg-slate-100 transition-transform
                  duration-300 ease-in-out
                  group-hover:scale-105
                "
              >
                <Image
                  src={getImageUrl(img.path)}
                  alt={`Photo ${img.id}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div
                  className="
                    absolute inset-0 opacity-0
                    group-hover:opacity-100 transition-opacity
                    duration-300 ease-in-out
                    flex flex-col justify-between p-2
                  "
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-white/20 text-white text-xs px-1 rounded">
                      #{img.id}
                    </span>
                    {onRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(img.id);
                        }}
                        className="
                          p-1 rounded
			  bg-red-600/50
                          transition-colors
                          hover:bg-red-600/80
                        "
                        title="Remove image"
                      >
                        <Trash2 size={16} className="text-red-200" />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end mt-auto">
                    <button
                      onClick={(e) => handleDownloadClick(e, img.path, img.id)}
                      className="
                        p-1 rounded
			bg-blue-600/50
                        transition-colors
                        hover:bg-blue-600/80
                      "
                      title="Download image"
                    >
                      <Download size={16} className="text-blue-200" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="p-0 w-[80vw] max-h-[90vh] overflow-y-auto max-w-none sm:max-w-[80Vvh] max-w-[80vw]"
        >
          {/* Title bar */}
          <DialogHeader className=" px-4 py-2">
            <DialogTitle className="text-left pt-2  w-full">
              Photo {selectedImage?.id}
            </DialogTitle>
            {imageSize != null && (
              <p className="mt-1 text-sm text-gray-500">
                {formatBytes(imageSize)}
              </p>
            )}{' '}
          </DialogHeader>

          {/* Floating button group */}
          {selectedImage && (
            <div className="absolute top-2 right-2 flex space-x-2">
              {/* Download */}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Download"
                onClick={(e) =>
                  handleDownloadClick(e, selectedImage.path, selectedImage.id)
                }
              >
                <Download className="w-5 h-5" />
              </Button>
              {/* Open in new tab */}
              <Button
                size="icon"
                variant="ghost"
                aria-label="Open in new tab"
                onClick={(e) => handleOpenNewTab(e, selectedImage.path)}
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
              {/* Close */}
              <DialogClose asChild>
                <Button size="icon" variant="ghost" aria-label="Close">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
            </div>
          )}

          {/* Scrollable body */}
          {selectedImage && (
            <div className="p-4 space-y-6">
              <div className="overflow-hidden rounded-lg shadow bg-slate-50">
                <div className="relative w-full aspect-video">
                  <Image
                    src={getImageUrl(selectedImage.path)}
                    alt={`Photo ${selectedImage.id}`}
                    fill
                    unoptimized
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* FACE PICKER */}
              {faceThumbs.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4">
                  {faceThumbs.map((thumb) => (
                    <Link
                      key={thumb.id}
                      href={`/search/${thumb.id}`}
                      className={`
          relative      /* for <Image fill> positioning */
    w-12 h-12     /* 48×48px */
    rounded-full
    overflow-hidden
    cursor-pointer
    ring-2 ring-transparent
    transition
    hover:scale-105
    hover:ring-blue-400        `}
                    >
                      <Image
                        src={thumb.dataUrl} // your data-URL from canvas.toDataURL()
                        alt={`Face ${thumb.id}`}
                        fill // absolutely fills the parent
                        unoptimized // don’t try to optimize a data-URL
                        style={{ objectFit: 'cover' }}
                      />{' '}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 p-4">No faces detected.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// src/components/ImageGallery.tsx
import React, { useState } from 'react'
import Image from 'next/image'
import { Trash2, Download, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'

export interface GalleryImage {
	id: number
	path: string
}

interface ImageGalleryProps {
	images: GalleryImage[]
	title: string
	emptyMessage: string
	onRemove?: (id: number) => void
	onDownload?: (imagePath: string, imageId: number) => void
}

export default function ImageGallery({
	images,
	title,
	emptyMessage,
	onRemove,
	onDownload,
}: ImageGalleryProps) {
	const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

	const getImageUrl = (imagePath: string) =>
		`http://localhost:8000/files/${imagePath}`

	const handleDownloadClick = async (
		e: React.MouseEvent,
		imagePath: string,
		imageId: number
	) => {
		e.stopPropagation()
		if (onDownload) {
			onDownload(imagePath, imageId)
			return
		}
		try {
			const res = await fetch(getImageUrl(imagePath))
			if (!res.ok) throw new Error(res.statusText)
			const blob = await res.blob()
			const blobUrl = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = blobUrl
			a.download = imagePath.split('/').pop() || `image-${imageId}.jpg`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(blobUrl)
		} catch {
			alert('Failed to download image')
		}
	}

	const handleRemoveClick = (e: React.MouseEvent, id: number) => {
		e.stopPropagation()
		onRemove?.(id)
	}

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
                  duration-300 ease-in-out group-hover:scale-105
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
									{/* Top: ID + Remove */}
									<div className="flex justify-between items-start">
										<span className="bg-white/20 text-white text-xs px-1 rounded">
											#{img.id}
										</span>
										{onRemove && (
											<button
												onClick={(e) => handleRemoveClick(e, img.id)}
												className="
                          bg-red-600/50 p-1 rounded
                          transition-colors duration-200 ease-in-out
                          hover:bg-red-600/80
                        "
												title="Remove image"
											>
												<Trash2 size={16} className="text-white" />
											</button>
										)}
									</div>
									{/* Bottom: Download */}
									<div className="flex justify-end mt-auto">
										<button
											onClick={(e) =>
												handleDownloadClick(e, img.path, img.id)
											}
											className="
                        bg-blue-600/50 p-1 rounded
                        transition-colors duration-200 ease-in-out
                        hover:bg-blue-600/80
                      "
											title="Download image"
										>
											<Download size={16} className="text-white" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* === shadcn Dialog Lightbox === */}
			<Dialog
				open={!!selectedImage}
				onOpenChange={(open) => {
					if (!open) setSelectedImage(null)
				}}
			>
				<DialogContent className="p-0  shadow-none max-w-[90vw]">
					<DialogHeader className="p-0">
						<DialogTitle className="">
							Photo {selectedImage?.id}
						</DialogTitle>
						<DialogClose asChild>
							<button
								className="
                  absolute top-2 right-2 z-10 p-1 rounded-full
                  bg-white/90 hover:bg-white transition
                "
								aria-label="Close"
							>
								<X size={20} />
							</button>
						</DialogClose>
					</DialogHeader>

					{selectedImage && (
						<div className="relative w-[90vw] max-w-[1000px] aspect-[4/3] bg-black">
							<Image
								src={getImageUrl(selectedImage.path)}
								alt={`Photo ${selectedImage.id}`}
								fill
								className="object-contain"
								unoptimized
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	)
}

'use client'
import React from 'react'
import { useProcessingQueue } from '@/contexts/ProcessingContext'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ProcessingQueue() {
	const { items } = useProcessingQueue()
	if (items.length === 0) return null

	return (
		<div
			className="
        fixed bottom-4 right-4
        w-64 max-h-80
        bg-white/90 backdrop-blur-sm
        shadow-lg rounded-lg
        overflow-auto p-4 text-sm
        space-y-2 z-50
      "
		>
			<h4 className="font-semibold mb-2">Processing…</h4>
			<ul className="space-y-1">
				{items.map((it) => (
					<li
						key={it.id}
						className="flex items-center space-x-2"
					>
						{it.status === 'processing' ? (
							<Loader2 className="h-4 w-4 animate-spin text-gray-600" />
						) : (
							<CheckCircle2 className="h-4 w-4 text-green-500" />
						)}
						<span className="truncate">{it.label}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

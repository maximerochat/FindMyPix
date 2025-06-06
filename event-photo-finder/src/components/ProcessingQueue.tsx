import React from 'react'
import { useProcessingQueue } from '@/contexts/ProcessingContext'

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
						<span
							className="
                inline-block
                h-4 w-4
                border-2 border-gray-300
                border-t-gray-600
                rounded-full
                animate-spin
              "
						/>
						<span className="truncate">{it.label}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

'use client'
import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
} from 'react'

export type ProcessingItem = {
	id: string
	label: string
	status: 'processing' | 'done'
}

type ProcessingContextValue = {
	items: ProcessingItem[]
	add: (item: { id: string; label: string }) => void
	done: (id: string) => void
	remove: (id: string) => void
}

const ProcessingContext = createContext<ProcessingContextValue | undefined>(
	undefined
)

export function ProcessingProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ProcessingItem[]>([])

	const add = (item: { id: string; label: string }) =>
		setItems((prev) => [
			...prev,
			{ id: item.id, label: item.label, status: 'processing' },
		])

	const remove = (id: string) =>
		setItems((prev) => prev.filter((i) => i.id !== id))

	const done = (id: string) => {
		setItems((prev) =>
			prev.map((i) =>
				i.id === id ? { ...i, status: 'done' } : i
			)
		)
		// auto‐remove after 3s
		setTimeout(() => {
			setItems((prev) => prev.filter((i) => i.id !== id))
		}, 3000)
	}

	return (
		<ProcessingContext.Provider value={{ items, add, done, remove }}>
			{children}
		</ProcessingContext.Provider>
	)
}

export function useProcessingQueue(): ProcessingContextValue {
	const ctx = useContext(ProcessingContext)
	if (!ctx)
		throw new Error(
			'useProcessingQueue must be used within a ProcessingProvider'
		)
	return ctx
}

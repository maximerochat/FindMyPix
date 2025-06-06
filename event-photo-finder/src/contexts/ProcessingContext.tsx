"use client"

import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
} from 'react'

export type ProcessingItem = {
	/** unique id for this task */
	id: string
	/** what to show in the UI (e.g. filename) */
	label: string
}

type ProcessingContextValue = {
	items: ProcessingItem[]
	add: (item: ProcessingItem) => void
	remove: (id: string) => void
}

const ProcessingContext = createContext<ProcessingContextValue | undefined>(
	undefined
)

export function ProcessingProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ProcessingItem[]>([])

	const add = (item: ProcessingItem) =>
		setItems((prev) => [...prev, item])

	const remove = (id: string) =>
		setItems((prev) => prev.filter((i) => i.id !== id))

	return (
		<ProcessingContext.Provider value={{ items, add, remove }}>
			{children}
		</ProcessingContext.Provider>
	)
}

export function useProcessingQueue(): ProcessingContextValue {
	const ctx = useContext(ProcessingContext)
	if (!ctx) {
		throw new Error(
			'useProcessingQueue must be used within a ProcessingProvider'
		)
	}
	return ctx
}

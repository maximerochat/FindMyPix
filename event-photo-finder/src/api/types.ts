export interface Embedding {
	id: number
	image_id: number
	x: number
	y: number
	w: number
	h: number
}

export interface ImageOut {
	id: number
	path: string
	embeddings: Embedding[] | null
}

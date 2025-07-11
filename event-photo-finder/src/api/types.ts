export interface Embedding {
  id: number;
  image_id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageOut {
  id: number;
  path: string;
  embeddings: Embedding[] | null;
  bbox: { x: number; y: number; w: number; h: number } | null;
}

export interface MatchResult {
  embedding_id: number;
  image_id: number;
  image_path: string;
  distance: number;
  threshold: number;
  bbox: { x: number; y: number; w: number; h: number };
  other_embeddings: Embedding[];
}

export interface EventIn {
  date: string | Date;
  title: string;
  description?: string;
}

export interface EventOut {
  id: number;
  is_owner: boolean;
  title: string;
  date: string;
  description?: string;
}

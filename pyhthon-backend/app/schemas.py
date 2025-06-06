from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict


class EmbeddingIn(BaseModel):
    x: float
    y: float
    w: float
    h: float
    vector: List[float]


class EmbeddingOut(BaseModel):
    id: int
    image_id: int
    x: float
    y: float
    w: float
    h: float


class ImageCreate(BaseModel):
    path: str


class ImageOut(BaseModel):
    id: int
    path: str
    embeddings: List[EmbeddingOut]


class MatchResult(BaseModel):
    embedding_id: int
    image_id: int
    image_path: str
    distance: float
    threshold: float
    bbox: Dict[str, int]

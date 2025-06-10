from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from datetime import datetime


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


class EventIn(BaseModel):
    date: datetime
    description: Optional[str] = None


class EventOut(BaseModel):
    id:          int
    date:        datetime
    description: Optional[str] = None
    is_owner:    bool

    model_config = ConfigDict(from_attributes=True)


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
    other_embeddings: List[EmbeddingOut]

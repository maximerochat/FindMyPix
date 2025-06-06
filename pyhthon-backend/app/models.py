from sqlalchemy import (
    Column, Integer, String, ForeignKey, Float, Index
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from .db import Base


class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, unique=True, nullable=False)
    embeddings = relationship("Embedding",
                              back_populates="image",
                              cascade="all, delete-orphan",
                              lazy="selectin",)


class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"),
                      nullable=False, index=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    w = Column(Float, nullable=False)
    h = Column(Float, nullable=False)
    vector = Column(Vector(512), nullable=False)

    image = relationship("Image", back_populates="embeddings")

    __table_args__ = (
        Index(
            "idx_embeddings_vector_ivf",
            "vector",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
        ),
    )

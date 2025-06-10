from sqlalchemy import (
    UUID, Column, Integer, String, ForeignKey, Float, Index, DateTime
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
    event = relationship(
        "Event",
        back_populates="images",
        lazy="joined",  # or “selectin” if you prefer
    )

    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


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


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(String)
    images = relationship("Image", back_populates="event",
                          cascade="all, delete-orphan", lazy="selectin")

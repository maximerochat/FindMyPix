from typing import Optional
import numpy as np
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    Float,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from pgvector.sqlalchemy import Vector

Base = declarative_base()


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    path = Column(String, nullable=False, unique=True)

    embeddings = relationship("Embedding", back_populates="image")
    participants = relationship("Participant", back_populates="image")


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    w = Column(Float, nullable=False)
    h = Column(Float, nullable=False)
    vector = Column(Vector(512), nullable=False)

    image = relationship("Image", back_populates="embeddings")
    participants = relationship("Participant", back_populates="embedding")

    __table_args__ = (
        # IVFFlat index for fast ANN (tune 'lists' to your dataset size)
        Index(
            "idx_embeddings_vector_ivf",
            "vector",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
        ),
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    embedding_id = Column(Integer, ForeignKey("embeddings.id"), nullable=False)

    image = relationship("Image", back_populates="participants")
    embedding = relationship("Embedding", back_populates="participants")


class FaceDB:
    def __init__(self, db_url: str):
        """
        db_url e.g. "postgresql+psycopg2://user:pass@host:port/dbname"
        """
        self.engine = create_engine(db_url)
        # create vector extension & tables
        with self.engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            Base.metadata.create_all(conn)
        self.Session = sessionmaker(bind=self.engine)

    def add_image(self, path: str) -> Image:
        """
        Insert a new Image row with the given path, or if one already exists
        with that path, do nothing (or update other fields if you add any).
        Returns the Image instance.
        """
        session = self.Session()
        insert_stmt = pg_insert(Image).values(path=path)
        stmt = insert_stmt.on_conflict_do_update(
            index_elements=[Image.path],
            # if you had other columns to update, list them here, e.g.
            # set_={"updated_at": func.now(), "other_col": stmt.excluded.other_col}
            set_={"path": insert_stmt.excluded.path}
        ).returning(Image.id)
        res = session.execute(stmt)
        img_id = res.scalar_one()
        session.commit()
        img = session.get(Image, img_id)
        session.close()
        return img

    def add_embedding(
        self,
        image_id: int,
        embedding: np.ndarray,
        bbox: dict[str, float],
    ) -> Embedding:
        """
        bbox: {"x":…, "y":…, "w":…, "h":…}
        """
        session = self.Session()
        emb = Embedding(
            image_id=image_id,
            x=bbox["x"],
            y=bbox["y"],
            w=bbox["w"],
            h=bbox["h"],
            vector=embedding,
        )
        session.add(emb)
        session.commit()
        session.refresh(emb)
        session.close()
        return emb

    def add_participant(self, image_id: int, embedding_id: int) -> Participant:
        session = self.Session()
        part = Participant(image_id=image_id, embedding_id=embedding_id)
        session.add(part)
        session.commit()
        session.refresh(part)
        session.close()
        return part

    def find_similar_embeddings(
        self,
        query_embedding: np.ndarray,
        limit: int = 5,
    ) -> list[tuple[Embedding, float]]:
        """
        Returns up to `limit` (Embedding, distance) pairs
        ordered by cosine distance to query_embedding.
        """
        session = self.Session()
        vec = query_embedding
        stmt = (
            session.query(
                Embedding,
                Embedding.vector.cosine_distance(vec).label("distance"),
            )
            .where(Embedding.vector.cosine_distance(vec) <= 0.68)
            .order_by(Embedding.vector.cosine_distance(vec))
            .limit(limit)
        )
        results = stmt.all()
        session.close()
        return results

    def get_image_by_id(self, image_id: int) -> Optional[Image]:
        """
        Fetch an Image row by its primary key.
        Returns None if no such Image exists.
        """
        session = self.Session()
        try:
            img = session.get(Image, image_id)
            return img
        finally:
            session.close()

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://face_user:admin@localhost:5432/face_db"
)

engine = create_async_engine(
    DATABASE_URL, echo=False, pool_size=10, max_overflow=20
)
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

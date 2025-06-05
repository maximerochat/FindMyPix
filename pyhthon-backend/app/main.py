import os
import shutil
from typing import List

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .db import engine, Base
from .crud import (
    get_or_create_image,
    add_embedding,
    list_embeddings,
    find_similar,
)
from .schemas import ImageOut, MatchResult
from .deps import get_db
from app.face_lib import get_embeddings  # <— our helper

app = FastAPI(title="FindMyPix API")


@app.on_event("startup")
async def on_startup():
    # create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.post("/images", response_model=ImageOut)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # 1) Save upload to local disk (or S3, etc.)
    save_dir = os.getenv("IMAGE_DIR", "data")
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    # 2) Upsert image record
    img = await get_or_create_image(db, path)

    # 3) Extract embeddings + bboxes via face_lib
    # embeds = get_embeddings(path)
    # if not embeds:
    #     raise HTTPException(400, detail="No faces detected in image")
    #
    # # 4) Persist each embedding
    # for emb in embeds:
    #     bbox = emb["facial_area"]
    #     vector = emb["embedding"]
    #     await add_embedding(db, img.id, bbox, vector)

    # 5) Fetch all embeddings back and return
    embs = await list_embeddings(db, img.id)
    embs_data = [
        {
            "id":         e.id,
            "image_id":   e.image_id,
            "x":          e.x,
            "y":          e.y,
            "w":          e.w,
            "h":          e.h,
        }
        for e in embs
    ]
    return ImageOut(
        id=img.id,
        path=img.path,
        embeddings=embs_data,
    )


@app.post("/match", response_model=List[MatchResult])
async def match_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # 1) save query to temp
    tmp_dir = "/tmp/findmypix"
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_path = os.path.join(tmp_dir, file.filename)
    with open(tmp_path, "wb") as f:
        f.write(await file.read())

    # 2) extract embeddings from query
    query_embeds = get_embeddings(tmp_path)
    if not query_embeds:
        raise HTTPException(400, detail="No face found in query image")

    # for now just take the first face
    target = query_embeds[0]["embedding"]

    # 3) find nearest neighbors in DB
    results = await find_similar(db, target, limit=10, metric="cosine")
    if not results:
        # empty list => no match under threshold
        return []

    return [MatchResult(**r) for r in results]


@app.get("/health")
async def health():
    return {"status": "ok"}

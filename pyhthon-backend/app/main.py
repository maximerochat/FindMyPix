import os
import time
import shutil
from typing import List

from app.models import Embedding
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware

from .db import engine, Base
from .crud import (
    get_embedding_by_id,
    get_or_create_image,
    add_embedding,
    list_embeddings,
    find_similar,
    get_image,
    delete_image_from_db,
    get_all_images,
)
from .schemas import ImageOut, MatchResult
from .deps import get_db
from app.face_lib import get_embeddings  # <— our helper

app = FastAPI(title="FindMyPix API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",

    # "https://my.production.frontend.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # <-- addresses that are allowed to talk to this API
    allow_credentials=True,
    allow_methods=["*"],          # <-- GET, POST, PUT, DELETE, OPTIONS, etc
    allow_headers=["*"],          # <-- any headers (e.g. Authorization)
)


IMAGE_DIR = os.getenv("IMAGE_DIR", "data")
app.mount(
    "/files",
    StaticFiles(directory=IMAGE_DIR),
    name="files",
)


@app.on_event("startup")
async def on_startup():
    # create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.delete(
    "/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Image not found"}},
)
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
):
    # 1) Look up the image
    image = await get_image(db, image_id)
    print("Image is ", image)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # 2) (Optional) remove the file from disk
    try:
        os.remove(image.path)
    except FileNotFoundError:
        pass

    # 3) Delete the Image row.
    await delete_image_from_db(db, image)

    # 4) Verify no embeddings remain
    remaining = await list_embeddings(db, image_id)
    if remaining and len(remaining) > 0:
        # Something went wrong with your cascade
        raise HTTPException(
            status_code=500,
            detail=f"Delete failed: {remaining} embeddings still exist"
        )

    # 5) 204 No Content has no body
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/images", response_model=List[ImageOut])
async def list_images(db: AsyncSession = Depends(get_db)):
    """
    Returns all images + their embeddings.
    Each `path` field is just the filename, clients can fetch the
    actual image at /files/{path}.
    """
    images = await get_all_images(db)
    return images


@app.post("/images", response_model=ImageOut)
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # 1) Save upload to local disk (or S3, etc.)
    save_dir = IMAGE_DIR
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    # 2) Upsert image record
    img = await get_or_create_image(db, file.filename)

    # 3) Extract embeddings + bboxes via face_lib
    embeds = get_embeddings(path)
    if not embeds:
        raise HTTPException(400, detail="No faces detected in image")

    # 4) Persist each embedding
    for emb in embeds:
        bbox = emb["facial_area"]
        vector = emb["embedding"]
        await add_embedding(db, img.id, bbox, vector)

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


@app.get("/match/{emb_id}", response_model=List[MatchResult])
async def match_image_with_id(
    emb_id: int,
    db: AsyncSession = Depends(get_db),
):

    # 2) extract embeddings from query
    query_embeds: Embedding = await get_embedding_by_id(db, emb_id)
    if not query_embeds:
        raise HTTPException(400, detail="No face found in query image")
    print(query_embeds)
    # for now just take the first face
    target = query_embeds.vector
    # 3) find nearest neighbors in DB
    results = await find_similar(db, target, limit=10, metric="cosine")
    if not results:
        # empty list => no match under threshold
        return []

    return [MatchResult(**r) for r in results]


@app.get("/health")
async def health():
    return {"status": "ok"}

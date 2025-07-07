import os
import time
import shutil
from typing import Any, List, Dict
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local", override=True)

from app.models import Embedding
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
from app.helpers import get_current_user
from uuid import UUID
from datetime import datetime
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
    create_event,
    get_event,
    get_all_events,
    update_event,
    delete_event,
)
from .schemas import EmbeddingOut, ImageOut, MatchResult, EventIn, EventOut
from .deps import get_db
from app.face_lib import get_embeddings  # <— our helper

app = FastAPI(title="FindMyPix API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],        
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


@app.post("/events", response_model=EventOut, status_code=201)
async def api_create_event(
    payload: EventIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ev = await create_event(db, user_id=current_user["id"], payload=payload)
    return EventOut(
        title=ev.title,
        id=ev.id,
        date=ev.date,
        description=ev.description,
        is_owner=True,    # creator is always owner
    )


@app.get("/events/my", response_model=List[EventOut])
async def api_list_my_events(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    evs = await get_all_events(db, user_id=current_user["id"])

    me = current_user["id"]
    return [
        EventOut(
            title=e.title,
            id=e.id,
            date=e.date,
            description=e.description,
            is_owner=(str(e.user_id) == me),
        )
        for e in evs
    ]


@app.get("/events/{event_id}", response_model=EventOut)
async def api_get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ev = await get_event(db, event_id)
    if not ev:
        raise HTTPException(404, "Event not found")
    return EventOut(
        title=ev.title,
        id=ev.id,
        date=ev.date,
        description=ev.description,
        is_owner=(ev.user_id == current_user["id"]),
    )


@app.get("/events", response_model=List[EventOut])
async def api_list_events(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    evs = await get_all_events(db)

    me = current_user["id"]
    return [
        EventOut(
            title=e.title,
            id=e.id,
            date=e.date,
            description=e.description,
            is_owner=(str(e.user_id) == me),
        )
        for e in evs
    ]


@app.put(
    "/events/{event_id}",
    response_model=EventOut,
    responses={404: {"description": "Event not found"}},
)
async def api_update_event(
    event_id: int,
    payload: EventIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ev = await update_event(db, event_id, payload=payload, user_id=current_user["id"])
    if not ev:
        raise HTTPException(404, "Event not found")

    return EventOut(
        title=ev.title,
        id=ev.id,
        date=ev.date,
        description=ev.description,
        is_owner=True,
    )


@app.delete(
    "/events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Event not found"}},
)
async def api_delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ok = await delete_event(db, event_id=event_id, user_id=current_user["id"])
    print("Ok is", ok)
    print(event_id)
    if not ok:
        raise HTTPException(404, "Event not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.delete(
    "/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Image not found"}},
)
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
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


@app.get("/images/{event_id}", response_model=List[ImageOut])
async def list_images(event_id: int, db: AsyncSession = Depends(get_db), current_user: Dict = Depends(get_current_user)):
    """
    Returns all images + their embeddings.
    Each `path` field is just the filename, clients can fetch the
    actual image at /files/{path}.
    """
    images = await get_all_images(db, event_id)
    return images


@app.post("/images/{event_id}", response_model=ImageOut)
async def upload_image(
    event_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    # 1) Save upload to local disk (or S3, etc.)
    save_dir = IMAGE_DIR
    os.makedirs(save_dir, exist_ok=True)
    path = os.path.join(save_dir, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    # 2) Upsert image record
    img = await get_or_create_image(db, file.filename, event_id)

    # 3) Extract embeddings + bboxes via face_lib
    embeds = await run_in_threadpool(get_embeddings, path)
    if not embeds:
        return ImageOut(
        id=img.id,
        path=img.path,
        embeddings=[],
        )
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


@app.post("/match/{event_id}", response_model=List[MatchResult])
async def match_image(
    event_id: int,
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
    results = await find_similar(db, target, event_id, limit=10, metric="cosine")
    if not results:
        # empty list => no match under threshold
        return []

    for res in results:
        embs = await list_embeddings(db, res["image_id"])
        embs_data: List[dict[str, Any]] = [
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
        res["other_embeddings"] = embs_data
    return [MatchResult(**r) for r in results]


@app.get("/match/{event_id}/{emb_id}", response_model=List[MatchResult])
async def match_image_with_id(
    event_id: int,
    emb_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):

    # 2) extract embeddings from query
    query_embeds: Embedding = await get_embedding_by_id(db, emb_id)
    if not query_embeds:
        raise HTTPException(400, detail="No face found in query image")
    # 3) find nearest neighbors in DB
    results = await find_similar(db, query_embeds.vector, event_id, limit=10, metric="cosine")

    for res in results:
        embs = await list_embeddings(db, res["image_id"])
        embs_data: List[dict[str, Any]] = [
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
        res["other_embeddings"] = embs_data
    return [MatchResult(**r) for r in results]


@ app.get("/health")
async def health():
    return {"status": "ok"}

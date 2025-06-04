import os
from typing import List, Optional
import numpy as np
import pandas as pd
from deepface import DeepFace

REF = "your_face.png"

# REF = "./event_photos/DSC_0109.JPG"
TGT = "./event_photos/DSC_0109.JPG"   # same image, so should match!
TGT = "./event_photos/DSC_0085.jpg"   # same image, so should match!

# find returns list of pandas dataframes
dfs = DeepFace.find(
    img_path=TGT, db_path="db", model_name="ArcFace", detector_backend="retinaface")
for df in dfs:
    print(df)
# maxime_embeding = DeepFace.represent(
#     REF, model_name="ArcFace", detector_backend="retinaface")
# # Photo -> embeding
# # Embeding -> Photo
#
# print(len(maxime_embeding))
#
# target_faces = DeepFace.represent(
#     TGT, detector_backend="retinaface", model_name="ArcFace")
# print(target_faces.__len__())
#
# for face in target_faces:
#     res = DeepFace.verification.find_cosine_distance(
#         face["embedding"], maxime_embeding[0]["embedding"])
#     print("Res is ", res)


def match_reference_in_target(
    reference_img_path: str,
    target_img_path: str,
    model_name: str = "ArcFace",
    detector_backend: str = "retinaface",
    distance_metric: str = "cosine",
    enforce_detection: bool = True,
    align: bool = True,
    threshold: Optional[float] = None,
) -> pd.DataFrame:
    """
    Compare one reference face to all faces in a target image.

    Returns a DataFrame with columns:
      - x, y, w, h      : bounding box in target
      - distance        : distance(reference_embedding, face_embedding)
      - threshold       : threshold used
      - is_match        : distance <= threshold
    """

    if not os.path.exists(reference_img_path):
        raise FileNotFoundError(f"Reference image not found: {
                                reference_img_path}")
    if not os.path.exists(target_img_path):
        raise FileNotFoundError(
            f"Target image not found:    {target_img_path}")

    # 1) Extract & embed the reference face (assume exactly 1 face)
    ref_objs = DeepFace.extract_faces(
        img_path=reference_img_path,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
    )
    if not ref_objs:
        raise ValueError("No face detected in reference image.")
    ref_face_np = ref_objs[0]["face"]

    ref_emb = DeepFace.represent(
        img_path=ref_face_np,
        model_name=model_name,
        detector_backend="skip",      # already cropped
        enforce_detection=False,      # no need to re-detect
        align=False,                  # already aligned
    )[0]["embedding"]

    # 2) Extract all faces from the target
    tgt_objs = DeepFace.extract_faces(
        img_path=target_img_path,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
    )
    if not tgt_objs:
        # return empty DataFrame with the right columns
        return pd.DataFrame(columns=["x", "y", "w", "h", "distance", "threshold", "is_match"])

    # 3) Compute distances and match-flags
    records = []
    thresh = (
        threshold
        if threshold is not None
        else DeepFace.verification.find_threshold(model_name, distance_metric)
    )

    for obj in tgt_objs:
        face_np = obj["face"]
        area = obj["facial_area"]  # dict with x,y,w,h

        # embed each target face
        emb = DeepFace.represent(
            img_path=face_np,
            model_name=model_name,
            detector_backend="skip",
            enforce_detection=False,
            align=False,
        )[0]["embedding"]

        # compute distance
        dist = DeepFace.verification.find_distance(
            ref_emb, emb, distance_metric)

        records.append({
            "x": area["x"],
            "y": area["y"],
            "w": area["w"],
            "h": area["h"],
            "distance": dist,
            "threshold": thresh,
            "is_match": dist <= thresh,
        })

    return pd.DataFrame(records)

#
# if __name__ == "__main__":
#     # example usage
#     # REF = "reference.jpg"
#     # TGT = "group.jpg"
#     df = match_reference_in_target(
#         reference_img_path=REF,
#         target_img_path=TGT,
#         model_name="ArcFace",
#         detector_backend="retinaface",
#         distance_metric="cosine",
#     )
#     print(df)

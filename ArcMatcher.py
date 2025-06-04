import os
from typing import Union, List, Dict, Any

import numpy as np
import pandas as pd


from deepface import DeepFace
detection = DeepFace.detection
representation = DeepFace.representation
verification = DeepFace.verification


def match_faces(
    reference_img: Union[str, np.ndarray],
    query_img: Union[str, np.ndarray],
    model_name: str = "ArcFace",
    detector_backend: str = "retinaface",
    distance_metric: str = "cosine",
    enforce_detection: bool = True,
    align: bool = True,
    expand_percentage: int = 0,
    threshold: float = None,
) -> pd.DataFrame:
    """
    Given a reference image of one person, find matching faces in a query image.

    Args:
        reference_img: path or BGR ndarray of the reference face.
        query_img: path or BGR ndarray of the image to search (may contain multiple faces).
        model_name: one of DeepFace’s models, e.g. "ArcFace".
        detector_backend: face detector, e.g. "retinaface", "mtcnn", "opencv", etc.
        distance_metric: "cosine", "euclidean" or "euclidean_l2".
        enforce_detection: if True, raise on undetected faces; else skip.
        align: whether to align faces based on eyes.
        expand_percentage: percent to expand face box when detecting.
        threshold: override the default model/distance threshold. If None,
            uses DeepFace’s pre‐tuned threshold.

    Returns:
        A pandas DataFrame with one row per matched face in `query_img`, columns:
        x, y, w, h (face box in query), distance, threshold.
    """
    # 1) Compute reference embedding
    ref_objs = detection.extract_faces(
        img_path=reference_img,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
        expand_percentage=expand_percentage,
    )
    if len(ref_objs) == 0:
        raise ValueError("No face found in reference image")
    # take first face
    ref_face = ref_objs[0]["face"]
    ref_emb = representation.represent(
        img_path=ref_face,
        model_name=model_name,
        # Potentially set it to false for performance reason
        enforce_detection=enforce_detection,
        detector_backend="skip",
        align=align,
        normalization="base",
    )[0]["embedding"]
    # 2) Detect faces in query image
    qry_objs = detection.extract_faces(
        img_path=query_img,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
        expand_percentage=expand_percentage,
    )
    if len(qry_objs) == 0:
        # no faces to match
        return pd.DataFrame(columns=["x", "y", "w", "h", "distance", "threshold"])

    # 3) Prepare output
    records: List[Dict[str, Any]] = []
    thr = threshold or verification.find_threshold(model_name, distance_metric)
    print("Selected threshold is ", thr)
    # 4) For each detected face in query, compute embedding & distance
    for obj in qry_objs:
        box = obj["facial_area"]
        face_img = obj["face"]
        emb = representation.represent(
            img_path=face_img,
            model_name=model_name,
            enforce_detection=enforce_detection,
            detector_backend="retinaface",
            align=align,
            normalization="base",
        )[0]["embedding"]

        dist = verification.find_distance(ref_emb, emb, distance_metric)
        print("Distance is ", dist)
        if dist <= thr:
            records.append({
                "x": box["x"],
                "y": box["y"],
                "w": box["w"],
                "h": box["h"],
                "distance": dist,
                "threshold": thr,
            })

    # 5) Return sorted DataFrame
    df = pd.DataFrame(records)
    if not df.empty:
        df = df.sort_values("distance", ascending=True).reset_index(drop=True)
    return df


# REF = "your_face.png"

# REF = "./event_photos/DSC_0110.JPG"
REF = "./db/Maxime/default_face.png"
TGT = "./event_photos/DSC_0109.JPG"
TGT = "./event_photos/DSC_0085.png"


ref_path = REF
qry_path = TGT

matches = match_faces(
    reference_img=ref_path,
    query_img=qry_path,
    model_name="ArcFace",
    detector_backend="retinaface",
    distance_metric="cosine",
    enforce_detection=False,
    align=False,
)
print(matches)

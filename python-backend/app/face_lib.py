import cv2
import pandas as pd
from typing import Union, Tuple, List, Any, Dict, Optional
import numpy as np

from deepface import DeepFace
from deepface.commons.logger import Logger

logger = Logger()


def match_faces(
    source_img: Union[str, np.ndarray],
    target_img: Union[str, np.ndarray],
    model_name: str = "ArcFace",
    distance_metric: str = "cosine",
    detector_backend: str = "retinaface",
    enforce_detection: bool = False,
    align: bool = True,
    expand_percentage: int = 0,
    normalization: str = "base",
    silent: bool = False,
) -> Tuple[pd.DataFrame, Any]:
    """
    Compare every face in source_img against the single face in target_img.

    Returns a DataFrame with columns:
      - source_x, source_y, source_w, source_h : bounding box of each face in source_img
      - distance    : distance to the target face embedding
      - threshold   : model+metric–specific threshold
      - match       : True iff distance <= threshold

    And a bool `match_found` that is True if any row has match == True.
    """
    # 1) Detect & embed the target face
    target_objs = DeepFace.detection.extract_faces(
        img_path=target_img,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
        expand_percentage=expand_percentage,
    )
    if len(target_objs) == 0:
        raise ValueError("No face found in target_img")
    if len(target_objs) > 1 and not silent:
        logger.info(f"Found {len(target_objs)} faces in target_img, using the first one.")
    target_face = target_objs[0]["face"]
    target_embedding = DeepFace.representation.represent(
        img_path=target_face,
        model_name=model_name,
        enforce_detection=enforce_detection,
        detector_backend="skip",
        align=align,
        normalization=normalization,
    )[0]["embedding"]

    # 2) Detect source faces
    source_objs = DeepFace.detection.extract_faces(
        img_path=source_img,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
        expand_percentage=expand_percentage,
    )
    if len(source_objs) == 0:
        if not silent:
            logger.info("No faces found in source_img")
        return pd.DataFrame(), False

    # 3) Compute threshold
    threshold = DeepFace.verification.find_threshold(
        model_name, distance_metric)

    # 4) For each source face, compute distance & flag match
    records = []
    for obj in source_objs:
        src_face = obj["face"]
        box = obj["facial_area"]
        src_embedding = DeepFace.representation.represent(
            img_path=src_face,
            model_name=model_name,
            enforce_detection=False,   # already cropped
            detector_backend="skip",
            align=False,
            normalization=normalization,
        )[0]["embedding"]

        dist = DeepFace.verification.find_distance(
            src_embedding, target_embedding, distance_metric
        )
        records.append({
            "source_x": box["x"],
            "source_y": box["y"],
            "source_w": box["w"],
            "source_h": box["h"],
            "distance": dist,
            "threshold": threshold,
            "match": dist <= threshold,
        })

    df = pd.DataFrame(records).sort_values("distance").reset_index(drop=True)
    match_found = df["match"].any()
    return df, match_found


def draw_matches(
    source_img: Union[str, np.ndarray],
    df: Tuple[float, float, float, float],
    color: tuple[int, int, int] = (0, 255, 0),
    thickness: int = 2,
) -> np.ndarray:
    """
    Draws rectangles around matched faces in source_img.

    Args:
      source_img: path to image or BGR numpy array.
      df: DataFrame returned by match_faces, with columns
          ['source_x','source_y','source_w','source_h','match'].
      color: BGR color for box.
      thickness: box line thickness.

    Returns:
      Annotated image as BGR numpy array.
    """
    # load image if a path is given
    if isinstance(source_img, str):
        img = cv2.imread(source_img)
        if img is None:
            raise ValueError(f"Could not read image at {source_img}")
    else:
        img = source_img.copy()

    # draw only the matched faces
    x, y, w, h = df
    print("df is ", df)
    pt1 = (int(x), int(y))
    pt2 = (int(x + w), int(y + h))
    cv2.rectangle(img, pt1, pt2, color, thickness=thickness)

    return img


def get_embeddings(
    img: Union[str, np.ndarray],
    model_name: str = "ArcFace",
    detector_backend: str = "retinaface",
    enforce_detection: bool = False,
    align: bool = True,
    expand_percentage: int = 0,
    normalization: str = "base",
) -> List[Dict[str, Any]]:
    """
    Detects all faces in `img` and returns their embeddings.
    """
    # 1) detect and crop faces
    face_objs = DeepFace.detection.extract_faces(
        img_path=img,
        detector_backend=detector_backend,
        enforce_detection=enforce_detection,
        align=align,
        expand_percentage=expand_percentage,
        anti_spoofing=True
    )
    embeddings: List[Dict[str, Any]] = []
    # 2) embed each face
    for obj in face_objs:
        face = obj["face"]
        rep = DeepFace.representation.represent(
            img_path=face,
            model_name=model_name,
            enforce_detection=False,
            detector_backend="skip",
            normalization=model_name,
            anti_spoofing=True
            
        )
        rep[0]["facial_area"] = obj["facial_area"]
        embeddings.append(rep[0])
    return embeddings


def match_embeddings(
    target_embedding: Dict[str, Any],
    embeddings: List[Dict[str, Any]],
    model_name: str = "ArcFace",
    distance_metric: str = "cosine",
) -> Optional[List[Dict[str, Any]]]:
    """
    Returns True if `target_embedding` matches any embedding in `embeddings`
    under the threshold for the given model and metric.
    """
    threshold = DeepFace.verification.find_threshold(
        model_name, distance_metric)
    valid_match = []
    distances = []
    for emb in embeddings:
        if emb is None:
            continue
        dist = DeepFace.verification.find_distance(
            emb["embedding"], target_embedding["embedding"], distance_metric
        )
        if dist <= threshold:
            distances.append(dist)
            valid_match.append(emb)
    if len(valid_match) == 0:
        return None
    return [emb for _, emb in sorted(zip(distances, valid_match))]


if __name__ == "__main__":
    REF = "./db/Maxime/default_face.png"

    # REF = "./event_photos/DSC_0109.JPG"
    # TGT = "./event_photos/DSC_0110.JPG"   # same image, so should match!
    TGT = "./event_photos/DSC_0085.jpg"   # same image, so should match!

    # df, found = match_faces(
    #     source_img=TGT,
    #     target_img=REF,
    #     model_name="ArcFace",
    #     distance_metric="cosine",
    #     detector_backend="retinaface",
    # )
    # pprint(df.to_dict(orient="records"))
    # print("Any match?", found)
    # # 2) draw and save
    # annotated = draw_matches(TGT, df)
    # out_path = Path("annotated.jpg")
    # cv2.imwrite(str(out_path), annotated)

    # print(f"Annotated image saved to {out_path}")

    embed_max = get_embeddings(REF)[0]
    embed_target = get_embeddings(TGT)
    res = match_embeddings(embed_max, embed_target)
    print(res)

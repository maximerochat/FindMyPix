import cv2
from Database import FaceDB
import numpy as np
from face_utils import draw_matches, get_embeddings, match_embeddings

db_url = "postgresql+psycopg2://face_user:admin@localhost:5432/face_db"

# 1) Initialize / migrate
db = FaceDB(db_url)

# example insert
# img = db.add_image(path="some/path.jpg")
# emb = np.random.rand(512)
# bbox = {"x": 0, "y": 0, "w": 100, "h": 100}
# db_ent = db.add_embedding(image_id=img.id, embedding=emb, bbox=bbox)

# example query
# results = db.find_similar_embeddings(query_embedding=emb, limit=3)
# for e, dist in results:
#     print(e.id, e.image_id, e.w, dist)


# image_path = "../event_photos/DSC_0085.png"
# img = db.add_image(path=image_path)
# embeddings = get_embeddings(image_path)
# for emb in embeddings:
#     f_area = emb["facial_area"]
#     bbox = {"x": f_area["x"], "y": f_area["y"],
#             "w": f_area["w"], "h": f_area["h"]}
#     print(emb)
#     print("type of emb", type(emb["embedding"]))
#     db.add_embedding(img.id, emb["embedding"], bbox)
image_path = "../your_face.png"
embedding = get_embeddings(image_path)[0]
res = db.find_similar_embeddings(embedding["embedding"], limit=10)
for e, dist in res:
    print(e.id, e.image_id, dist, e.x, e.y, e.w, e.h)
    shape_tuple = (e.x, e.y, e.w, e.h)
    print("Tuple is ", shape_tuple)
    res = db.get_image_by_id(e.image_id)
    if res is not None:
        img = draw_matches(res.path, shape_tuple)
        cv2.imwrite("annotated2.jpg", img)

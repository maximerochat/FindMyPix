import face_recognition
import os

# --- Configuration ---
YOUR_FACE_IMAGE_PATH = "./event_photos/DSC_0109.JPG"
EVENT_PHOTOS_DIR = "event_photos"
# Lower this value for stricter matches, higher for looser matches.
MATCH_TOLERANCE = 0.6
# 0.6 is a common default for typical use cases.

# --- Step 1: Load your uploaded face and get its encoding ---
try:
    your_face_image = face_recognition.load_image_file(YOUR_FACE_IMAGE_PATH)
    your_face_encodings = face_recognition.face_encodings(your_face_image)

    if not your_face_encodings:
        print(f"Error: No face found in '{
              YOUR_FACE_IMAGE_PATH}'. Please ensure it contains a clear single face.")
        exit()

    # We assume there's only one main face in the uploaded image
    your_target_face_encoding = your_face_encodings[0]
    print(f"Successfully encoded your target face from '{
          YOUR_FACE_IMAGE_PATH}'.")

except FileNotFoundError:
    print(f"Error: Your face image not found at '{YOUR_FACE_IMAGE_PATH}'.")
    print("Please create a 'your_face.jpg' file or update the path.")
    exit()
except Exception as e:
    print(f"An error occurred loading your face image: {e}")
    exit()

# --- Step 2: Process event photos ---
found_matches = []
event_photo_files = [f for f in os.listdir(
    EVENT_PHOTOS_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

if not event_photo_files:
    print(f"No image files found in '{
          EVENT_PHOTOS_DIR}'. Please add some event photos.")
    exit()

print(f"\nProcessing {len(event_photo_files)
                      } event photos in '{EVENT_PHOTOS_DIR}'...")

for filename in event_photo_files:
    filepath = os.path.join(EVENT_PHOTOS_DIR, filename)
    print(f"  - Analyzing '{filename}'...")

    try:
        event_image = face_recognition.load_image_file(filepath)
        # Find all face locations and encodings in the current event photo
        face_locations = face_recognition.face_locations(event_image)
        face_encodings = face_recognition.face_encodings(
            event_image, face_locations)

        if not face_encodings:
            print(f"    No faces found in '{filename}'. Skipping.")
            continue

        for i, face_encoding in enumerate(face_encodings):
            # Compare the target face with each face found in the event photo
            matches = face_recognition.compare_faces(
                [your_target_face_encoding], face_encoding, tolerance=MATCH_TOLERANCE
            )
            face_distance = face_recognition.face_distance(
                [your_target_face_encoding], face_encoding)[0]

            if True in matches:
                # If a match is found, record the photo and face location
                top, right, bottom, left = face_locations[i]
                found_matches.append({
                    "filename": filename,
                    "location": (top, right, bottom, left),
                    "distance": face_distance  # Lower distance means better match
                })
                print(f"    Match found in '{filename}' at location (top:{top}, right:{
                      right}, bottom:{bottom}, left:{left})! Distance: {face_distance:.4f}")
            # else:
            #     print(f"    No match for face {i+1} in '{filename}'. Distance: {face_distance:.4f}")

    except Exception as e:
        print(f"    An error occurred processing '{filename}': {e}")
        continue

# --- Step 3: Display results ---
print("\n--- Search Results ---")
if found_matches:
    print(f"Found you in {len(found_matches)} instances across event photos!")
    # Sort matches by distance (lower distance is a better match)
    found_matches.sort(key=lambda x: x['distance'])
    for match in found_matches:
        print(f"  - Photo: {match['filename']
                            }, Distance: {match['distance']:.4f}")
else:
    print("Sorry, no matches found based on the provided tolerance.")

print("\nProof of concept complete.")

import os
import time
import requests
import json

BASE = "http://127.0.0.1:5000"
ZONE_ID = 1
IMAGE_FOLDER = "samples"   # put sample images here
POLL_INTERVAL = 2                # seconds between checks
UPLOAD_INTERVAL = 5              # seconds between uploads


def pretty(title, obj):
    print(f"\n===== {title} =====")
    print(json.dumps(obj, indent=2))


def upload_image(path):
    url = f"{BASE}/api/upload-image"
    with open(path, "rb") as f:
        files = {"image": (os.path.basename(path), f, "image/jpeg")}
        data = {"zone_id": str(ZONE_ID)}
        r = requests.post(url, files=files, data=data)
    try:
        return r.json()
    except:
        print("Bad response:", r.text)
        return None


def get_prediction():
    url = f"{BASE}/api/zones/{ZONE_ID}/predict-latest"
    r = requests.get(url)
    try:
        return r.json()
    except:
        print("Bad response:", r.text)
        return None


def wait_for_prediction():
    print("[INFO] Waiting for backend to process image...")
    while True:
        res = get_prediction()
        if not res or "error" in res:
            pretty("Prediction Error", res)
            return res

        if res.get("cached") is True:
            pretty("Prediction Ready", res)
            return res
        
        # still computing?
        print("[INFO] Prediction not cached yet. Retrying...")
        time.sleep(POLL_INTERVAL)


def main():
    print("=== Starting ESP32-CAM Mimic Script ===")
    images = [os.path.join(IMAGE_FOLDER, f) for f in os.listdir(IMAGE_FOLDER)
              if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    if not images:
        print("No images found in sample_images/. Add some and rerun.")
        return

    for img in images:
        print(f"\nUploading image: {os.path.basename(img)}")

        up_res = upload_image(img)
        pretty("Upload Response", up_res)

        prediction = wait_for_prediction()

        print("\n-------------------------------------------")
        time.sleep(UPLOAD_INTERVAL)

    print("\n=== DONE ===")


if __name__ == "__main__":
    main()

import requests
import json
import time
from pathlib import Path

BASE = "http://127.0.0.1:5000"
ZONE_ID = 1

# Change to a real test image path.
TEST_IMAGE = "test.jpg"  


# --------------------------------------------------------------
# Helper
# --------------------------------------------------------------
def pretty(label, data):
    print(f"\n===== {label} =====")
    try:
        print(json.dumps(data, indent=2))
    except:
        print(data)


# --------------------------------------------------------------
# 1. Test /ping
# --------------------------------------------------------------
def test_ping():
    print("\n### 1. Testing /ping...")
    r = requests.get(f"{BASE}/ping")
    pretty("Ping Response", r.json())


# --------------------------------------------------------------
# 2. Test GET /api/zones/<id>
# --------------------------------------------------------------
def test_get_zone():
    print("\n### 2. Testing GET zone info...")
    r = requests.get(f"{BASE}/api/zones/{ZONE_ID}")
    pretty("Zone Data", r.json())
    return r.json()


# --------------------------------------------------------------
# 3. Test POST /api/upload-image  (saves DB + predicts)
# --------------------------------------------------------------
def test_upload_image():
    print("\n### 3. Testing /api/upload-image with prediction & DB save...")

    if not Path(TEST_IMAGE).exists():
        raise FileNotFoundError(f"Test image not found: {TEST_IMAGE}")

    files = {
        "image": open(TEST_IMAGE, "rb")
    }
    data = {"zone_id": str(ZONE_ID)}

    r = requests.post(f"{BASE}/api/upload-image", files=files, data=data)
    pretty("Upload Image Response", r.json())

    return r.json()


# --------------------------------------------------------------
# 4. Test GET zone again (should show latest_image)
# --------------------------------------------------------------
def test_get_zone_after_upload():
    print("\n### 4. Checking zone after image upload...")
    r = requests.get(f"{BASE}/api/zones/{ZONE_ID}")
    pretty("Zone After Upload", r.json())
    return r.json()


# --------------------------------------------------------------
# 5. Test /api/predict-image (no DB saving)
# --------------------------------------------------------------
def test_predict_only():
    print("\n### 5. Testing /api/predict-image (no DB save)...")

    files = {
        "image": open(TEST_IMAGE, "rb")
    }
    r = requests.post(f"{BASE}/api/predict-image", files=files)
    pretty("Predict-Only Response", r.json())
    return r.json()


# --------------------------------------------------------------
# 6. Stress Test — Upload 3 images
# --------------------------------------------------------------
def test_upload_multiple_images():
    print("\n### 6. Uploading 3 images for stress test...")

    for i in range(3):
        print(f"\n--- Upload #{i+1} ---")
        files = {"image": open(TEST_IMAGE, "rb")}
        data = {"zone_id": str(ZONE_ID)}
        r = requests.post(f"{BASE}/api/upload-image", files=files, data=data)
        pretty(f"Image #{i+1} Response", r.json())
        time.sleep(1)


# --------------------------------------------------------------
# 7. Test mode, threshold, irrigation logic
# --------------------------------------------------------------
def test_irrigation_and_modes():
    print("\n### 7. Testing mode + threshold + irrigation behavior...")

    # Set mode to auto
    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/mode", json={"mode": "auto"})
    pretty("Mode Set to AUTO", r.json())

    # Update threshold
    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/threshold", json={"threshold": 25})
    pretty("Threshold Update", r.json())

    # Try starting irrigation while AUTO → expect 400
    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/irrigation", json={"action": "start"})
    pretty("Irrigation Start While AUTO", {"status_code": r.status_code, "text": r.text})

    # Switch to manual
    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/mode", json={"mode": "manual"})
    pretty("Mode Set to MANUAL", r.json())

    # Now irrigation should accept start/stop
    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/irrigation", json={"action": "start"})
    pretty("Irrigation Start Manual", r.json())

    time.sleep(1)

    r = requests.post(f"{BASE}/api/zones/{ZONE_ID}/irrigation", json={"action": "stop"})
    pretty("Irrigation Stop Manual", r.json())


# --------------------------------------------------------------
# MAIN
# --------------------------------------------------------------
if __name__ == "__main__":
    print("### RUNNING FULL END-TO-END TEST ###")

    test_ping()
    test_get_zone()
    test_upload_image()
    test_get_zone_after_upload()
    test_predict_only()
    test_upload_multiple_images()
    test_irrigation_and_modes()

    print("\n### COMPLETE — review the printed results ###")

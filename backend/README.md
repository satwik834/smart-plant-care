# 🌱 EPICS Smart Irrigation Backend

A Flask-based REST API backend for an **AI-powered smart irrigation system**. It collects soil moisture, temperature, and humidity readings from IoT sensors (ESP32), manages irrigation zones with auto/manual control, and uses a fine-tuned **EfficientNet** model (TorchScript) to detect plant health from images uploaded by an ESP32-CAM.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Reference](#api-reference)
- [ML Model](#ml-model)
- [Setup & Installation](#setup--installation)
- [Running the Server](#running-the-server)
- [Testing](#testing)
- [ESP32-CAM Simulator](#esp32-cam-simulator)

---

## Features

- 📡 **IoT Sensor Ingestion** — Accepts soil moisture, temperature, and humidity readings from ESP32 devices
- 🚿 **Smart Irrigation Control** — Auto mode triggers irrigation based on moisture threshold; manual mode allows explicit start/stop commands
- 🌿 **Plant Health Detection** — EfficientNet (TorchScript) model classifies plant images as `healthy` or `unhealthy`
- 🗄️ **Persistent Storage** — SQLite database via Flask-SQLAlchemy with Flask-Migrate for schema management
- 🖼️ **Image Management** — Accepts image uploads, stores them, and caches inference results per zone
- 🔌 **CORS Enabled** — Ready for cross-origin requests from a frontend or mobile app

---

## Architecture Overview

```
ESP32 / ESP32-CAM
       │
       │  HTTP (JSON / multipart)
       ▼
┌─────────────────────┐
│   Flask REST API    │  ← app.py
│  (Port 5000)        │
├─────────────────────┤
│  SQLAlchemy ORM     │  ← models.py
│  SQLite Database    │
├─────────────────────┤
│  EfficientNet ML    │  ← ml_model_torchscript.py
│  (TorchScript)      │  ← efficientnet_scripted.pt
└─────────────────────┘
```

---

## Project Structure

```
backend/
├── app.py                      # Flask application factory & all route definitions
├── models.py                   # SQLAlchemy ORM models (Zone, Reading, ImageUpload)
├── ml_model_torchscript.py     # TorchScript model loader & inference helpers
├── efficientnet_scripted.pt    # Pre-trained & scripted EfficientNet model weights
├── mimic_esp.py                # ESP32-CAM simulator script for local testing
├── test_predict.py             # End-to-end API test suite
├── requirements.txt            # Python dependencies
├── instance/
│   └── db.sqlite               # SQLite database (auto-created on first run)
├── uploads/                    # Uploaded images (auto-created)
└── samples/                    # Sample images for mimic_esp.py
```

---

## Database Models

### `Zone`
Represents an irrigation zone (e.g., a plant or garden bed).

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Unique zone ID |
| `name` | String | Display name (e.g., "Zone 1 - Money Plant") |
| `threshold` | Integer | Moisture % below which auto-irrigation triggers (default: 30) |
| `irrigation_on` | Boolean | Current irrigation state |
| `irrigation_mode` | String | `"auto"` or `"manual"` |

### `Reading`
A single sensor data snapshot for a zone.

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Reading ID |
| `zone_id` | Integer (FK) | Associated zone |
| `moisture` | Float | Soil moisture percentage |
| `temperature` | Float | Ambient temperature (°C) |
| `humidity` | Float | Ambient humidity (%) |
| `timestamp` | DateTime | UTC timestamp (auto-set) |

### `ImageUpload`
Stores uploaded images and their ML inference results.

| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Image record ID |
| `zone_id` | Integer (FK) | Associated zone |
| `filename` | String | Saved filename in `uploads/` |
| `timestamp` | DateTime | UTC timestamp (auto-set) |
| `processed` | Boolean | Whether inference has run |
| `prediction_label` | String | `"healthy"` or `"unhealthy"` |
| `prediction_confidence` | Float | Model confidence score (0–1) |
| `prediction_raw` | Float | Raw probability of "unhealthy" class |

---

## API Reference

### Health Check

#### `GET /ping`
Returns server status and current UTC time.

**Response:**
```json
{ "Status": "OK", "time": "2025-01-01T12:00:00+00:00" }
```

---

### Zones

#### `GET /api/zones`
Returns all zones with their latest sensor reading.

**Response:** Array of zone objects, each including a `last_reading` field.

---

#### `GET /api/zones/<zone_id>`
Returns full details for a zone, including the last 100 readings and the latest uploaded image metadata.

**Response:**
```json
{
  "zone": { "id": 1, "name": "Zone 1", "threshold": 30, "irrigation_on": false, "irrigation_mode": "auto" },
  "readings": [ ... ],
  "latest_image": { ... }
}
```

---

### Sensor Readings

#### `POST /api/readings`
Ingest a new sensor reading. In auto mode, irrigation is automatically activated if `moisture < threshold`.

**Request Body:**
```json
{
  "zone_id": 1,
  "moisture": 22,
  "temperature": 28.5,
  "humidity": 65.0
}
```

**Response:** `201` with the created reading and updated zone state.

---

### Irrigation Control

#### `POST /api/zones/<zone_id>/irrigation`
Manually start or stop irrigation. Only allowed when zone is in `"manual"` mode.

**Request Body:**
```json
{ "action": "start" }
```
> `action` must be `"start"` or `"stop"`. Returns `400` if zone is in `"auto"` mode.

---

#### `POST /api/zones/<zone_id>/mode`
Switch a zone between `"auto"` and `"manual"` irrigation modes.

**Request Body:**
```json
{ "mode": "auto" }
```
> Switching to `"auto"` resets `irrigation_on` to `false` for safety.

---

#### `POST /api/zones/<zone_id>/threshold`
Update the soil moisture threshold used in auto mode.

**Request Body:**
```json
{ "threshold": 25 }
```

---

### Image Upload & ML Inference

#### `POST /api/upload-image`
Upload a plant image for a zone (multipart form). The image is saved to disk and an `ImageUpload` record is created. Inference runs lazily on first `predict-latest` request.

**Form Data:**
- `image` — Image file (`.jpg`, `.jpeg`, `.png`)
- `zone_id` — Zone ID (string)

**Response:** `201` with `image_id`.

---

#### `GET /api/zones/<zone_id>/predict-latest`
Runs ML inference on the most recently uploaded image for the zone. Results are cached in the database after first inference.

**Response:**
```json
{
  "prediction_label": "healthy",
  "confidence": 0.91,
  "scores": { "healthy": 0.91, "unhealthy": 0.09 },
  "raw_prob_unhealthy": 0.09,
  "cached": false,
  "filename": "1704067200_leaf.jpg"
}
```

---

#### `POST /api/predict-image`
Direct inference on an uploaded image without saving to the database.

**Form Data:** `image` — Image file

**Response:** `200` with the prediction dict.

---

#### `GET /uploads/<filename>`
Serve a previously uploaded image file.

---

## ML Model

The model is a **binary image classifier** (EfficientNet) exported as a **TorchScript** file (`efficientnet_scripted.pt`).

- **Input:** RGB image, resized to `224×224`, normalized with ImageNet mean/std
- **Output:** A sigmoid probability — `P(unhealthy)`
- **Classes:** Configurable via the `ML_CLASS_NAMES` environment variable (default: `healthy,unhealthy`)
- **Device:** Automatically uses CUDA if available, otherwise CPU

The module `ml_model_torchscript.py` exposes:
- `load_model()` — Lazy singleton loader
- `predict_bytes(img_bytes)` — Predict from raw bytes
- `predict_file(path)` — Predict from a file path

---

## Setup & Installation

### Prerequisites
- Python 3.9+
- pip

### 1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

### 2. Create and activate a virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

> **Note:** `torch` and `torchvision` are required for ML inference but are **not** in `requirements.txt` to avoid pinning platform-specific builds. Install them separately:
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
> ```

### 4. Ensure model weights are present
The file `efficientnet_scripted.pt` must be in the project root. The server will warn (but still start) if the model is missing.

---

## Running the Server

```bash
python app.py
```

The server starts on **http://127.0.0.1:5000** in debug mode. The SQLite database and `uploads/` folder are created automatically on first launch. A default zone ("Zone 1 - Money Plant") is seeded if the database is empty.

---

## Testing

Run the end-to-end test suite (requires the server to be running):

```bash
python test_predict.py
```

The test script covers:
1. `/ping` health check
2. `GET /api/zones/<id>` zone data retrieval
3. `POST /api/upload-image` image upload
4. Zone state after upload
5. `POST /api/predict-image` direct inference
6. Stress test (3 consecutive uploads)
7. Mode switching, threshold updates, and irrigation control logic

A `test.jpg` file in the project root is used as the test image.

---

## ESP32-CAM Simulator

`mimic_esp.py` simulates an ESP32-CAM device for local development. It reads images from the `samples/` folder and submits them to the backend at regular intervals, then polls for the prediction result.

**Configuration** (edit at the top of the file):
| Variable | Default | Description |
|---|---|---|
| `BASE` | `http://127.0.0.1:5000` | Backend URL |
| `ZONE_ID` | `1` | Target zone |
| `POLL_INTERVAL` | `2` | Seconds between prediction polls |
| `UPLOAD_INTERVAL` | `5` | Seconds between image uploads |

**Usage:**
```bash
# Add sample images to the samples/ folder, then:
python mimic_esp.py
```

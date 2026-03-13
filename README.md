# Smart Plant Nursery Monitoring System

A full-stack IoT solution for monitoring and managing plant health in a nursery environment. The system combines **real-time sensor data**, **AI-powered disease detection**, and **automated/manual irrigation control** into a unified platform accessible via a mobile app.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Hardware Integration](#hardware-integration)
- [Contributing](#contributing)

---

## Overview

This project was built as part of an **EPICS (Engineering Projects in Community Service)** initiative. It provides an intelligent nursery management system that:

- Collects **soil moisture, temperature, and humidity** data from IoT sensors (ESP32)
- Runs **AI-based plant disease detection** using a fine-tuned EfficientNet model
- Delivers a **React Native mobile app** for real-time monitoring and irrigation control
- Supports both **automatic** (threshold-based) and **manual** irrigation modes

---

## Architecture

```
┌──────────────────────┐       HTTP/REST        ┌──────────────────────┐
│   ESP32 IoT Device   │ ─────────────────────► │   Flask REST API     │
│  (Sensors + Camera)  │                        │  (Python Backend)    │
└──────────────────────┘                        │  ┌────────────────┐  │
                                                │  │  SQLite DB     │  │
┌──────────────────────┐       HTTP/REST        │  └────────────────┘  │
│  React Native App    │ ◄───────────────────── │  ┌────────────────┐  │
│  (Expo, iOS/Android) │                        │  │ EfficientNet   │  │
└──────────────────────┘                        │  │ ML Model (.pt) │  │
                                                │  └────────────────┘  │
                                                └──────────────────────┘
```

---

## Features

- **Real-time Dashboard** — Monitor all plant zones with live sensor readings
- **AI Disease Detection** — On-device image inference classifying plants as *healthy* or *unhealthy* (EfficientNet, TorchScript)
- **Smart Irrigation** — Auto mode triggers irrigation based on configurable moisture thresholds; manual mode gives full control
- **Camera Integration** — Capture or select photos directly from the mobile app for instant analysis
- **Reading History** — View up to 100 historical sensor readings per zone
- **Zone Management** — Configure moisture thresholds per zone from the app
- **ESP32 Mimic Script** — A Python script to simulate ESP32-CAM behavior for development/testing

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python / Flask | REST API server |
| Flask-SQLAlchemy | ORM & database layer |
| Flask-Migrate | Database migrations |
| SQLite | Lightweight embedded database |
| PyTorch (TorchScript) | ML model inference |
| EfficientNet | Plant disease classification model |
| Pillow / torchvision | Image preprocessing |

### Frontend
| Technology | Purpose |
|---|---|
| React Native 0.81 | Cross-platform mobile UI |
| Expo ~54 / Expo Router | Navigation & build toolchain |
| NativeWind / Tailwind CSS | Utility-first styling |
| expo-camera / expo-image-picker | Camera & gallery access |

---

## Project Structure

```
EPICS/
├── backend/                        # Flask REST API
│   ├── app.py                      # Application factory & all API routes
│   ├── models.py                   # SQLAlchemy models (Zone, Reading, ImageUpload)
│   ├── ml_model_torchscript.py     # EfficientNet TorchScript inference engine
│   ├── mimic_esp.py                # ESP32-CAM simulator for testing
│   ├── efficientnet_scripted.pt    # Pre-trained TorchScript model weights
│   ├── requirements.txt            # Python dependencies
│   ├── samples/                    # Sample images for mimic_esp.py
│   └── uploads/                    # Runtime image upload storage
│
├── frontend/
│   └── smart-plant/                # Expo React Native app
│       ├── app/
│       │   ├── _layout.jsx         # Root navigation layout
│       │   ├── index.jsx           # Dashboard screen (zone list)
│       │   ├── capture.jsx         # Camera / quick analysis screen
│       │   └── zone/[id].jsx       # Zone detail & history screen
│       ├── lib/
│       │   └── api.js              # API client (all backend calls)
│       ├── assets/                 # Images, fonts, icons
│       ├── package.json
│       └── ...
│
├── datasets/                       # (Training data — not tracked in git)
├── backed_test.py                  # Backend integration test script
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- (Optional) CUDA GPU for faster ML inference

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# Additional dependencies not in requirements.txt:
pip install torch torchvision pillow flask-cors

# 4. Run the Flask server
python app.py
```

The API will be available at `http://localhost:5000`.

> **Note:** The `efficientnet_scripted.pt` model file is included in the repository. The backend will automatically load it on startup.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend app
cd frontend/smart-plant

# 2. Install dependencies
npm install

# 3. Configure the API base URL
# Edit lib/api.js and set BASE_URL to your backend's IP address
# (use your machine's local network IP, not localhost, for physical devices)

# 4. Start the Expo development server
npx expo start

# Then scan the QR code with the Expo Go app, or press:
#   'a' for Android emulator
#   'i' for iOS simulator
#   'w' for web browser
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ping` | Health check |
| `GET` | `/api/zones` | List all zones with latest reading |
| `GET` | `/api/zones/<id>` | Zone details, last 100 readings & latest image |
| `POST` | `/api/readings` | Submit sensor reading from ESP32 |
| `POST` | `/api/zones/<id>/irrigation` | Trigger manual irrigation start/stop |
| `POST` | `/api/zones/<id>/mode` | Switch between `auto` and `manual` mode |
| `POST` | `/api/zones/<id>/threshold` | Update moisture threshold |
| `POST` | `/api/upload-image` | Upload plant image for a zone |
| `POST` | `/api/predict-image` | Instant image disease prediction (no storage) |
| `GET` | `/api/zones/<id>/predict-latest` | Run inference on latest uploaded image |
| `GET` | `/uploads/<filename>` | Serve uploaded image files |

### Example: Submit a Sensor Reading

```json
POST /api/readings
{
  "zone_id": 1,
  "moisture": 25,
  "temperature": 28.5,
  "humidity": 65.0
}
```

### Example: Prediction Response

```json
{
  "prediction_label": "unhealthy",
  "confidence": 0.87,
  "raw_prob_unhealthy": 0.87,
  "cached": false,
  "filename": "1710000000_plant.jpg"
}
```

---

## Hardware Integration

The system is designed to work with an **ESP32** microcontroller equipped with:
- Capacitive soil moisture sensor
- DHT22 temperature & humidity sensor
- ESP32-CAM module (for image capture)

The ESP32 sends POST requests to `/api/readings` and `/api/upload-image` at regular intervals.

For development without hardware, use the included **mimic script**:

```bash
# Add sample plant images to backend/samples/
cd backend
python mimic_esp.py
```

---

## Database Models

| Model | Fields |
|---|---|
| `Zone` | `id`, `name`, `threshold`, `irrigation_on`, `irrigation_mode` |
| `Reading` | `id`, `zone_id`, `moisture`, `temperature`, `humidity`, `timestamp` |
| `ImageUpload` | `id`, `zone_id`, `filename`, `timestamp`, `processed`, `prediction_label`, `prediction_confidence`, `prediction_raw` |

---


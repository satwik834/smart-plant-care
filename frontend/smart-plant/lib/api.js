// lib/api.js
export const BASE_URL = "http://10.69.250.96:5000"; // your backend URL

export async function fetchZones() {
    const res = await fetch(`${BASE_URL}/api/zones`);
    if (!res.ok) throw new Error("Failed to fetch zones");
    return res.json();
}

export async function fetchZoneDetails(id) {
    const res = await fetch(`${BASE_URL}/api/zones/${id}`);
    if (!res.ok) throw new Error("Failed to fetch zone details");
    return res.json();
}

export async function triggerIrrigation(id, action) {
    const res = await fetch(`${BASE_URL}/api/zones/${id}/irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error("Failed to trigger irrigation");
    return res.json();
}

export async function updateMode(id, mode) {
    const res = await fetch(`${BASE_URL}/api/zones/${id}/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
    });
    if (!res.ok) throw new Error("Failed to update mode");
    return res.json();
}

export async function fetchLatestPrediction(zoneId) {
    const res = await fetch(`${BASE_URL}/api/zones/${zoneId}/predict-latest`);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Prediction failed: ${text}`);
    }
    return res.json();
}

/** NEW — manual prediction from camera / gallery */
export async function predictImage(formData) {
    const res = await fetch(`${BASE_URL}/api/predict-image`, {
        method: "POST",
        body: formData, // DO NOT set Content-Type manually
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Predict-image failed: ${text}`);
    }

    return res.json();
}

/** Helper to get uploaded image full URL */
export function getUploadUrl(filename) {
    if (!filename) return null;
    return `${BASE_URL}/uploads/${filename}`;
}
export async function updateThreshold(zoneId, threshold) {
    const res = await fetch(`${BASE_URL}/api/zones/${zoneId}/threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Threshold update failed: ${text}`);
    }
    return res.json();
}

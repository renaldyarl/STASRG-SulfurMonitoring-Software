import asyncio
import threading
import json
import serial
import time
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from app.ml_service import predict, predict_all_nodes, get_loaded_node_ids, build_features
from app import crud

router = APIRouter()

serial_instance = None
serial_lock = threading.Lock()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


async def ingest_reading(data: dict):
    """Single ingestion path: broadcast to WebSocket clients and persist.

    Used both by the serial worker and the dev-only POST /ingest endpoint so
    seeded data flows through the exact same pipeline as real hardware.
    """
    await manager.broadcast(data)
    await crud.save_reading(data)

# --- UBAH SERIAL PORT SESUSAI OS DAN MICROCONTROLLER ---
SERIAL_PORT = "/dev/ttyACM0"  # ESP32C3
# SERIAL_PORT = "/dev/ttyUSB0" # HELTEC ESP32S3
BAUD_RATE = 115200


def serial_to_websocket_task(loop):
    global serial_instance

    with serial_lock:
        if serial_instance is not None:
            print("Serial already running, skipping duplicate thread.")
            return

        try:
            serial_instance = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
            serial_instance.reset_input_buffer()
            print(f"--- SUCCESS: Serial Port Opened on {SERIAL_PORT} ---")
        except Exception as e:
            print(f"Failed to open Serial: {e}")
            return

    try:
        while True:
            if serial_instance.in_waiting > 0:
                line = (
                    serial_instance.readline().decode("utf-8", errors="ignore").strip()
                )
                parts = line.split(",")
                if len(parts) == 8:
                    data = {
                        "node_id": parts[0].strip(),
                        "so2": float(parts[1]),
                        "h2s": float(parts[2]),
                        "temp": float(parts[3]),
                        "humidity": float(parts[4]),
                        "wind_speed": float(parts[5]),
                        "bus_voltage": float(parts[6]),
                        "current_ma": float(parts[7]),
                        "lat": -6.973235,
                        "lng": 107.632604,
                        "wind_dir": 0,
                        "timestamp": time.time(),
                    }
                    asyncio.run_coroutine_threadsafe(ingest_reading(data), loop)
    except Exception as e:
        print(f"Serial Loop Error: {e}")
    finally:
        with serial_lock:
            if serial_instance:
                serial_instance.close()
                serial_instance = None


def start_serial_worker():
    import os

    if os.environ.get("RUN_MAIN") == "true" or not os.environ.get("RELOAD"):
        loop = asyncio.get_event_loop()
        thread = threading.Thread(
            target=serial_to_websocket_task, args=(loop,), daemon=True
        )
        thread.start()
    else:
        print("Skipping thread start in watcher process...")


# ─── REST Endpoints ──────────────────────────────────────────────────────────

@router.get("/status")
async def get_status():
    return {
        "status": "online",
        "device": SERIAL_PORT,
        "serial_connected": (
            serial_instance is not None if "serial_instance" in globals() else False
        ),
    }


class ReadingIn(BaseModel):
    """A single sensor reading, matching the serial-worker data dict."""
    node_id: str
    so2: float
    h2s: float
    temp: float
    humidity: float
    wind_speed: float = 0.0
    bus_voltage: float = 0.0
    current_ma: float = 0.0
    lat: float = -6.973235
    lng: float = 107.632604
    wind_dir: int = 0
    timestamp: float | None = None


@router.post("/ingest")
async def ingest(reading: ReadingIn):
    """Dev/seed ingestion: push a reading through broadcast + persistence,
    exactly like a line read from the serial port. Lets you drive the
    dashboard and fill the DB without ESP32 hardware."""
    data = reading.model_dump()
    if data["timestamp"] is None:
        data["timestamp"] = time.time()
    await ingest_reading(data)
    return {"ok": True}


@router.get("/readings")
async def list_readings(
    node_id: str | None = Query(None, description="Filter by node id (e.g. '1' or 'r')"),
    limit: int = Query(100, ge=1, le=1000),
    since: datetime | None = Query(None, description="Only readings at/after this time (ISO 8601)"),
):
    """Return recent persisted sensor readings, newest first."""
    return {"readings": await crud.get_readings(node_id=node_id, limit=limit, since=since)}


@router.get("/predictions")
async def list_predictions(
    node_id: int | None = Query(None, description="Filter by node id (1-6)"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Return recent persisted ML predictions, newest first."""
    return {"predictions": await crud.get_predictions(node_id=node_id, limit=limit)}


@router.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─── ML Prediction Endpoints ────────────────────────────────────────────────

@router.get("/models/status")
async def models_status():
    """Check which ML models are currently loaded."""
    loaded = get_loaded_node_ids()
    return {
        "loaded_models": loaded,
        "total": len(loaded),
        "nodes_without_model": ["r"],
        "input_features": [
            "h2s", "so2", "hum", "temp", "windspeed",
            "hour", "minute", "minute_of_day",
            "h2s_diff", "so2_diff", "gas_ratio_so2_h2s",
        ],
        "output_labels": ["h2s", "so2"],
    }


@router.get("/predict/{node_id}")
async def predict_node(
    node_id: int,
    h2s: float = Query(..., description="H2S concentration (µg/m³)"),
    so2: float = Query(..., description="SO2 concentration (µg/m³)"),
    hum: float = Query(..., description="Humidity (%)"),
    temp: float = Query(..., description="Temperature (°C)"),
    windspeed: float = Query(0.0, description="Wind speed (m/s)"),
    h2s_prev: float = Query(0.0, description="Previous H2S reading for diff calculation"),
    so2_prev: float = Query(0.0, description="Previous SO2 reading for diff calculation"),
):
    """
    Run prediction for a single sensor node (1-6).
    Derived features (hour, minute, minute_of_day, diffs, gas ratio)
    are computed automatically from the raw values.
    
    Output: predicted h2s and so2 concentrations.
    """
    if node_id not in range(1, 7):
        return {"error": f"Node {node_id} does not have a model. Only nodes 1-6 are supported."}

    features = build_features(
        h2s=h2s, so2=so2, hum=hum, temp=temp, windspeed=windspeed,
        h2s_prev=h2s_prev, so2_prev=so2_prev,
    )
    result = predict(node_id, features)
    await crud.save_prediction(node_id, result)
    return result


class PredictAllRequest(BaseModel):
    """Request body for batch prediction across all nodes."""
    h2s: float
    so2: float
    hum: float
    temp: float
    windspeed: float = 0.0
    h2s_prev: float = 0.0
    so2_prev: float = 0.0


@router.post("/predict/all")
async def predict_all(req: PredictAllRequest):
    """
    Run prediction for all sensor nodes (1-6) using the same input features.
    Node R is excluded (no model).
    Output: predicted h2s and so2 for each node.
    """
    features = build_features(
        h2s=req.h2s, so2=req.so2, hum=req.hum, temp=req.temp,
        windspeed=req.windspeed, h2s_prev=req.h2s_prev, so2_prev=req.so2_prev,
    )
    features_per_node = {node_id: features for node_id in range(1, 7)}
    results = predict_all_nodes(features_per_node)
    for result in results:
        await crud.save_prediction(result.get("node_id"), result)
    return {"predictions": results}


class PredictPerNodeRequest(BaseModel):
    """Request body for per-node batch prediction with different features per node."""
    nodes: dict[int, list[float]]


@router.post("/predict/batch")
async def predict_batch(req: PredictPerNodeRequest):
    """
    Run prediction for specific nodes with different pre-built feature vectors.
    Each feature vector must have 11 elements matching the model input order.
    
    Body example:
    {
        "nodes": {
            1: [h2s, so2, hum, temp, windspeed, hour, minute, minute_of_day, h2s_diff, so2_diff, gas_ratio],
            3: [h2s, so2, hum, temp, windspeed, hour, minute, minute_of_day, h2s_diff, so2_diff, gas_ratio]
        }
    }
    """
    valid_nodes = {k: v for k, v in req.nodes.items() if k in range(1, 7)}
    results = predict_all_nodes(valid_nodes)
    for result in results:
        await crud.save_prediction(result.get("node_id"), result)
    return {"predictions": results}



import pickle
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

# ─── Configuration ───────────────────────────────────────────────────────────
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
NODE_IDS = [1, 2, 3, 4, 5, 6]  # Node R is excluded

INPUT_FEATURES = [
    "h2s", "so2", "hum", "temp", "windspeed",
    "hour", "minute", "minute_of_day",
    "h2s_diff", "so2_diff", "gas_ratio_so2_h2s",
]

OUTPUT_LABELS = ["h2s", "so2"]

# ─── Model registry ─────────────────────────────────────────────────────────
_models: dict[int, object] = {}


def load_all_models():
    """Load all XGBoost models from disk into memory at startup."""
    loaded = 0
    for node_id in NODE_IDS:
        model_path = MODELS_DIR / f"node_{node_id}_xgb.pkl"
        if model_path.exists():
            try:
                with open(model_path, "rb") as f:
                    _models[node_id] = pickle.load(f)
                print(f"  [OK] Loaded model for Node {node_id}: {model_path.name}")
                loaded += 1
            except (FileNotFoundError, pickle.UnpicklingError, ValueError, OSError) as e:
                print(f"  [FAIL] Failed to load model for Node {node_id}: {e}")
        else:
            print(f"  [FAIL] Model file not found for Node {node_id}: {model_path}")

    print(f"--- ML Models: {loaded}/{len(NODE_IDS)} loaded ---")


def get_model(node_id: int):
    """Get the loaded model for a given node ID."""
    return _models.get(node_id)


def get_loaded_node_ids() -> list[int]:
    """Return list of node IDs that have models loaded."""
    return list(_models.keys())


def build_features(
    h2s: float,
    so2: float,
    hum: float,
    temp: float,
    windspeed: float,
    h2s_prev: float = 0.0,
    so2_prev: float = 0.0,
    timestamp: datetime | None = None,
) -> list[float]:
    """
    Build the full 11-feature input vector from raw sensor readings.

    Derived features:
      - hour, minute, minute_of_day: extracted from timestamp
      - h2s_diff: h2s - h2s_prev
      - so2_diff: so2 - so2_prev
      - gas_ratio_so2_h2s: so2 / h2s (guarded against division by zero)
    """
    if timestamp is None:
        timestamp = datetime.now(UTC)

    hour = timestamp.hour
    minute = timestamp.minute
    minute_of_day = hour * 60 + minute
    h2s_diff = h2s - h2s_prev
    so2_diff = so2 - so2_prev
    gas_ratio_so2_h2s = so2 / h2s if h2s != 0 else 0.0

    return [
        h2s, so2, hum, temp, windspeed,
        hour, minute, minute_of_day,
        h2s_diff, so2_diff, gas_ratio_so2_h2s,
    ]


def predict(node_id: int, features: list[float]) -> dict:
    """
    Run prediction for a specific sensor node.

    Args:
        node_id: The sensor node ID (1-6).
        features: 11-element input feature vector.

    Returns:
        Dict with prediction results (h2s, so2) or error info.
    """
    model = get_model(node_id)
    if model is None:
        return {
            "node_id": node_id,
            "error": f"No model loaded for node {node_id}",
            "prediction": None,
        }

    try:
        X = np.array(features).reshape(1, -1)
        raw_prediction = model.predict(X)

        # Handle shape: could be (1, 2) or (1,)
        if hasattr(raw_prediction, "tolist"):
            raw_prediction = raw_prediction.tolist()

        # Flatten if nested
        pred = raw_prediction[0] if isinstance(raw_prediction[0], list) else raw_prediction

        # Map to output labels
        prediction_dict = {}
        for i, label in enumerate(OUTPUT_LABELS):
            prediction_dict[label] = float(pred[i]) if i < len(pred) else None

        return {
            "node_id": node_id,
            "prediction": prediction_dict,
            "features_used": dict(zip(INPUT_FEATURES, features)),
            "error": None,
        }
    except Exception as e:  # noqa: BLE001
        return {
            "node_id": node_id,
            "error": str(e),
            "prediction": None,
        }


def predict_all_nodes(features_per_node: dict[int, list[float]]) -> list[dict]:
    """
    Run predictions for multiple nodes at once.

    Args:
        features_per_node: Dict mapping node_id -> 11-element feature vector.

    Returns:
        List of prediction results for each node.
    """
    results = []
    for node_id in NODE_IDS:
        if node_id in features_per_node:
            results.append(predict(node_id, features_per_node[node_id]))
        else:
            results.append({
                "node_id": node_id,
                "error": "No features provided",
                "prediction": None,
            })
    return results

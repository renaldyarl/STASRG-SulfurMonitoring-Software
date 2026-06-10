"""CRUD helpers for persisting and querying sensor readings and predictions.

All write helpers are guarded by `database.db_ready` and wrapped in try/except
so a DB hiccup never crashes the serial loop or a request handler.
"""

from datetime import datetime, timezone

from sqlalchemy import select

from app import database
from app.models import SensorReading, Prediction


async def save_reading(data: dict):
    """Insert one sensor reading from the broadcast dict built in api.py."""
    if not database.db_ready:
        return
    try:
        ts = data.get("timestamp")
        reading_time = (
            datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None
        )
        async with database.AsyncSessionLocal() as session:
            reading = SensorReading(
                node_id=str(data.get("node_id")),
                so2=data.get("so2"),
                h2s=data.get("h2s"),
                temp=data.get("temp"),
                humidity=data.get("humidity"),
                wind_speed=data.get("wind_speed"),
                bus_voltage=data.get("bus_voltage"),
                current_ma=data.get("current_ma"),
                lat=data.get("lat"),
                lng=data.get("lng"),
                wind_dir=data.get("wind_dir"),
                **({"time": reading_time} if reading_time else {}),
            )
            session.add(reading)
            await session.commit()
    except Exception as e:
        print(f"Failed to save reading: {e}")


async def save_prediction(node_id: int, result: dict):
    """Insert one prediction from an ml_service.predict result (skips errors)."""
    if not database.db_ready:
        return
    if result.get("error") is not None or not result.get("prediction"):
        return
    try:
        prediction = result["prediction"]
        async with database.AsyncSessionLocal() as session:
            session.add(
                Prediction(
                    node_id=node_id,
                    h2s_pred=prediction.get("h2s"),
                    so2_pred=prediction.get("so2"),
                    features_used=result.get("features_used"),
                )
            )
            await session.commit()
    except Exception as e:
        print(f"Failed to save prediction: {e}")


async def get_readings(node_id: str | None = None, limit: int = 100, since: datetime | None = None):
    """Return recent sensor readings, newest first."""
    if not database.db_ready:
        return []
    async with database.AsyncSessionLocal() as session:
        stmt = select(SensorReading)
        if node_id is not None:
            stmt = stmt.where(SensorReading.node_id == node_id)
        if since is not None:
            stmt = stmt.where(SensorReading.time >= since)
        stmt = stmt.order_by(SensorReading.time.desc()).limit(limit)
        rows = (await session.execute(stmt)).scalars().all()
        return [_reading_to_dict(r) for r in rows]


async def get_predictions(node_id: int | None = None, limit: int = 100):
    """Return recent predictions, newest first."""
    if not database.db_ready:
        return []
    async with database.AsyncSessionLocal() as session:
        stmt = select(Prediction)
        if node_id is not None:
            stmt = stmt.where(Prediction.node_id == node_id)
        stmt = stmt.order_by(Prediction.time.desc()).limit(limit)
        rows = (await session.execute(stmt)).scalars().all()
        return [_prediction_to_dict(r) for r in rows]


def _reading_to_dict(r: SensorReading) -> dict:
    return {
        "id": r.id,
        "node_id": r.node_id,
        "so2": r.so2,
        "h2s": r.h2s,
        "temp": r.temp,
        "humidity": r.humidity,
        "wind_speed": r.wind_speed,
        "bus_voltage": r.bus_voltage,
        "current_ma": r.current_ma,
        "lat": r.lat,
        "lng": r.lng,
        "wind_dir": r.wind_dir,
        "time": r.time.isoformat() if r.time else None,
    }


def _prediction_to_dict(p: Prediction) -> dict:
    return {
        "id": p.id,
        "node_id": p.node_id,
        "h2s_pred": p.h2s_pred,
        "so2_pred": p.so2_pred,
        "features_used": p.features_used,
        "time": p.time.isoformat() if p.time else None,
    }

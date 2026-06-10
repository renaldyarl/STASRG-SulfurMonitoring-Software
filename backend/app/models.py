"""SQLAlchemy ORM models for persisted sensor data and ML predictions."""

from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Index, func

from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True)
    # TEXT so it can hold "r" as well as "1".."6".
    node_id = Column(String, nullable=False, index=True)
    so2 = Column(Float)
    h2s = Column(Float)
    temp = Column(Float)
    humidity = Column(Float)
    wind_speed = Column(Float)
    bus_voltage = Column(Float)
    current_ma = Column(Float)
    lat = Column(Float)
    lng = Column(Float)
    wind_dir = Column(Integer)
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (Index("ix_sensor_readings_node_time", "node_id", "time"),)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True)
    # Predictions exist only for nodes 1-6.
    node_id = Column(Integer, nullable=False, index=True)
    h2s_pred = Column(Float)
    so2_pred = Column(Float)
    features_used = Column(JSON)
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (Index("ix_predictions_node_time", "node_id", "time"),)

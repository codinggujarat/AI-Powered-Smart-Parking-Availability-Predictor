from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    is_admin = Column(Boolean, default=False)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    address_line = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    favorites = relationship("UserFavorite", back_populates="user")

class UserFavorite(Base):
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    zone_id = Column(String, ForeignKey("zones.zone_id"))

    user = relationship("User", back_populates="favorites")
    zone = relationship("Zone")

class Zone(Base):
    __tablename__ = "zones"

    zone_id = Column(String, primary_key=True, index=True)
    zone_name = Column(String, nullable=False)
    zone_type = Column(String)  # 'Street', 'Garage', 'Lot'
    district = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    hourly_rate = Column(Float)
    operating_hours = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    occupancy_records = relationship("Occupancy", back_populates="zone")
    predictions = relationship("Prediction", back_populates="zone")

class Occupancy(Base):
    __tablename__ = "parking_occupancy"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("zones.zone_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    occupied_spots = Column(Integer, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    occupancy_percentage = Column(Float, nullable=False)
    data_source = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    zone = relationship("Zone", back_populates="occupancy_records")

class Event(Base):
    __tablename__ = "events"

    event_id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    event_type = Column(String)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    venue = Column(String)
    expected_attendance = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, ForeignKey("zones.zone_id"), nullable=False)
    prediction_time = Column(DateTime, nullable=False, index=True)
    predicted_availability = Column(Float, nullable=False)
    confidence_score = Column(Float)
    model_version = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    zone = relationship("Zone", back_populates="predictions")

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    level = Column(String)  # 'info', 'warning', 'error'
    message = Column(String)
    source = Column(String)

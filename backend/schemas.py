from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    address_line: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class ZoneBase(BaseModel):
    zone_id: str
    zone_name: str
    zone_type: str
    district: str
    latitude: float
    longitude: float
    total_capacity: int
    hourly_rate: Optional[float] = None
    operating_hours: Optional[str] = None

class Zone(ZoneBase):
    created_at: datetime
    updated_at: datetime
    current_occupancy: Optional[int] = None
    current_availability: Optional[float] = None

    model_config = {
        "from_attributes": True
    }

class OccupancyBase(BaseModel):
    zone_id: str
    timestamp: datetime
    occupied_spots: int
    total_capacity: int
    occupancy_percentage: float

class Occupancy(OccupancyBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class EventBase(BaseModel):
    event_name: str
    event_type: str
    start_time: datetime
    end_time: datetime
    latitude: float
    longitude: float
    venue: str
    expected_attendance: Optional[int] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    event_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class PredictionBase(BaseModel):
    zone_id: str
    prediction_time: datetime
    predicted_availability: float
    confidence_score: float
    model_version: str

class Prediction(PredictionBase):
    prediction_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PredictionBatchRequest(BaseModel):
    zone_ids: List[str]
    time: Optional[datetime] = None

class PredictionBatchResponse(BaseModel):
    predictions: List[dict]

class SystemLogBase(BaseModel):
    message: str
    level: str
    source: str

class SystemLog(SystemLogBase):
    id: int
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }

class GoogleLoginRequest(BaseModel):
    token: str

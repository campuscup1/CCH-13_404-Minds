from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class RoleEnum(str, Enum):
    CLIENT = "CLIENT"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"

class EmergencyCategory(str, Enum):
    CARDIAC = "CARDIAC"
    TRAUMA = "TRAUMA"
    RESPIRATORY = "RESPIRATORY"
    NEUROLOGICAL = "NEUROLOGICAL"
    PEDIATRIC = "PEDIATRIC"
    GENERAL = "GENERAL"

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class AmbulanceType(str, Enum):
    ALS = "ALS"  # Advanced Life Support (Ventilator, Defibrillator, Paramedic)
    BLS = "BLS"  # Basic Life Support (Oxygen, First Aid, EMT)

class AmbulanceStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE_TO_PATIENT = "EN_ROUTE_TO_PATIENT"
    ARRIVED_AT_SCENE = "ARRIVED_AT_SCENE"
    PICKUP_CONFIRMED = "PICKUP_CONFIRMED"
    EN_ROUTE_TO_HOSPITAL = "EN_ROUTE_TO_HOSPITAL"
    ARRIVED_AT_HOSPITAL = "ARRIVED_AT_HOSPITAL"

class JourneyStage(str, Enum):
    PENDING_DISPATCH = "PENDING_DISPATCH"
    STAGE_1_DISPATCH_TO_PATIENT = "STAGE_1_DISPATCH_TO_PATIENT"
    STAGE_2_PATIENT_TO_HOSPITAL = "STAGE_2_PATIENT_TO_HOSPITAL"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

# Coordinates
class Coordinate(BaseModel):
    lat: float
    lon: float

# Auth schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user_id: str
    username: str
    ambulance_id: Optional[str] = None
    station_id: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    username: str
    name: str
    role: RoleEnum
    ambulance_id: Optional[str] = None
    station_id: Optional[str] = None

# Route Schemas
class RouteSegment(BaseModel):
    from_node: str
    to_node: str
    distance_meters: float
    travel_time_seconds: float
    traffic_factor: float
    is_blocked: bool
    coordinates: List[Coordinate]

class RouteInfo(BaseModel):
    algorithm: str
    path_nodes: List[str]
    coordinates: List[Coordinate]
    total_distance_km: float
    total_duration_minutes: float
    is_rerouted: bool = False
    reroute_reason: Optional[str] = None
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

# Station & Ambulance Schemas
class AmbulanceStation(BaseModel):
    id: str
    name: str
    address: str
    coordinate: Coordinate
    total_ambulances: int
    available_ambulances: int

class Ambulance(BaseModel):
    id: str
    vehicle_number: str
    vehicle_type: AmbulanceType
    status: AmbulanceStatus
    station_id: str
    assigned_driver_id: Optional[str] = None
    current_location: Coordinate
    equipment: List[str] = []
    active_emergency_id: Optional[str] = None

# Hospital Schemas
class Hospital(BaseModel):
    id: str
    name: str
    address: str
    coordinate: Coordinate
    specialties: List[EmergencyCategory]
    total_icu_beds: int
    available_icu_beds: int
    total_er_beds: int
    available_er_beds: int
    burn_unit_available: bool = False
    trauma_level: int = 1  # 1 = highest capability
    contact_phone: str

class HospitalRecommendationScore(BaseModel):
    hospital: Hospital
    specialty_match_score: float
    bed_capacity_score: float
    eta_minutes: float
    distance_km: float
    composite_score: float
    reason: str
    recommended_route: Optional[RouteInfo] = None

# Emergency Schemas
class EmergencyCreateRequest(BaseModel):
    caller_name: str
    caller_phone: str
    patient_name: Optional[str] = "Unknown"
    patient_age: Optional[int] = None
    category: EmergencyCategory
    severity: SeverityLevel
    description: str
    pickup_address: str
    pickup_coordinate: Coordinate

class EmergencyIncident(BaseModel):
    id: str
    caller_name: str
    caller_phone: str
    patient_name: str
    category: EmergencyCategory
    severity: SeverityLevel
    description: str
    pickup_address: str
    pickup_coordinate: Coordinate
    nearest_node_id: str
    
    # Journey lifecycle
    journey_stage: JourneyStage
    assigned_ambulance_id: Optional[str] = None
    assigned_station_id: Optional[str] = None
    destination_hospital_id: Optional[str] = None
    
    # Routes for the two stages
    stage1_route: Optional[RouteInfo] = None
    stage2_route: Optional[RouteInfo] = None
    
    # Hospital recommendations
    hospital_recommendations: List[HospitalRecommendationScore] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    pickup_confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# Simulation & Management Requests
class RoadblockToggleRequest(BaseModel):
    u_node: str
    v_node: str
    is_blocked: bool
    reason: Optional[str] = "Obstacle / Accident on road"

class TrafficCongestionRequest(BaseModel):
    u_node: str
    v_node: str
    traffic_factor: float = Field(..., ge=0.05, le=1.0, description="1.0 is free flow, 0.25 is severe traffic congestion")

class DriverStatusUpdateRequest(BaseModel):
    status: AmbulanceStatus
    note: Optional[str] = None

class DriverLocationUpdateRequest(BaseModel):
    current_coordinate: Coordinate
    speed_kmh: Optional[float] = None

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from app.models.schemas import EmergencyCreateRequest, EmergencyIncident
from app.data.database import db

router = APIRouter(tags=["Client / Public"])

@router.post("/emergency/request", response_model=EmergencyIncident, status_code=status.HTTP_201_CREATED)
def submit_emergency_request(payload: EmergencyCreateRequest):
    """
    Client / Public Endpoint (No login required).
    Submit an emergency distress call.
    The system immediately identifies and assigns the best available ambulance
    using Bidirectional A* ERT and vehicle suitability (ALS vs BLS), 
    and predicts the optimal route to the emergency location.
    """
    incident = db.create_emergency_and_dispatch(
        caller_name=payload.caller_name,
        caller_phone=payload.caller_phone,
        patient_name=payload.patient_name,
        category=payload.category,
        severity=payload.severity,
        description=payload.description,
        pickup_address=payload.pickup_address,
        pickup_coord=payload.pickup_coordinate
    )
    return incident

@router.get("/emergency/{emergency_id}", response_model=EmergencyIncident)
def track_emergency_incident(emergency_id: str):
    """
    Client / Public Endpoint (No login required).
    Real-time status tracking for an active or past emergency call:
    - Current journey stage
    - Assigned ambulance details & current GPS coordinates
    - Stage 1 route (Station to Emergency Location)
    - Stage 2 route & recommended hospital (once pickup is confirmed)
    - Dynamic reroute alerts if roadblocks or traffic occur
    """
    incident = db.get_emergency(emergency_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency incident {emergency_id} not found."
        )
    return incident

@router.get("/public/map-data")
def get_public_map_data() -> Dict[str, Any]:
    """
    Public Endpoint (No login required).
    Returns all road network nodes, edges (with congestion and road blocks),
    ambulance stations, hospitals, and fleet status for map rendering.
    """
    return {
        "nodes": list(db.nodes.values()),
        "edges": db.edges,
        "stations": [s.dict() for s in db.get_all_stations()],
        "hospitals": [h.dict() for h in db.get_all_hospitals()],
        "ambulances": [a.dict() for a in db.get_all_ambulances()],
    }

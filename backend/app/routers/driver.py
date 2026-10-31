from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from app.models.schemas import (
    DriverStatusUpdateRequest, DriverLocationUpdateRequest, 
    AmbulanceStatus, EmergencyIncident, Ambulance, JourneyStage
)
from app.core.auth import require_driver
from app.data.database import db

router = APIRouter(prefix="/driver", tags=["Ambulance Driver"])

@router.get("/my-dispatch")
def get_driver_dispatch(driver: Dict[str, Any] = Depends(require_driver)) -> Dict[str, Any]:
    """
    Ambulance Driver Endpoint (Login required).
    Retrieve assigned ambulance details and the active emergency mission.
    """
    ambulance = db.get_driver_ambulance(driver["id"])
    if not ambulance:
        # Check if driver has an assigned ambulance_id in profile
        amb_id = driver.get("ambulance_id")
        if amb_id:
            ambulance = db.get_ambulance(amb_id)

    if not ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ambulance is currently assigned to this driver."
        )

    active_incident = None
    if ambulance.active_emergency_id:
        active_incident = db.get_emergency(ambulance.active_emergency_id)

    return {
        "driver_id": driver["id"],
        "driver_name": driver["name"],
        "ambulance": ambulance,
        "active_emergency": active_incident
    }

@router.post("/status")
def update_driver_status(
    payload: DriverStatusUpdateRequest,
    driver: Dict[str, Any] = Depends(require_driver)
) -> Dict[str, Any]:
    """
    Ambulance Driver Endpoint (Login required).
    Update vehicle mission status.
    Key lifecycle milestones:
    - DISPATCHED / EN_ROUTE_TO_PATIENT: En route to scene.
    - ARRIVED_AT_SCENE: Reached patient location.
    - PICKUP_CONFIRMED: Patient boarded. Automatically triggers the
      Intelligent Hospital Recommendation Engine (matching specialty, ICU capacity, ETA)
      and produces Stage 2 dynamic route to selected hospital.
    - ARRIVED_AT_HOSPITAL: Reached hospital. Journey completes and ambulance is freed.
    """
    ambulance = db.get_driver_ambulance(driver["id"])
    if not ambulance and driver.get("ambulance_id"):
        ambulance = db.get_ambulance(driver["ambulance_id"])

    if not ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver does not have an assigned ambulance."
        )

    old_status = ambulance.status
    ambulance.status = payload.status
    incident: Optional[EmergencyIncident] = None

    if ambulance.active_emergency_id:
        incident = db.get_emergency(ambulance.active_emergency_id)

    message = f"Status updated from {old_status.value} to {payload.status.value}."

    # When driver confirms pickup, trigger hospital recommendation & stage 2 route
    if payload.status == AmbulanceStatus.PICKUP_CONFIRMED and incident:
        incident = db.confirm_pickup_and_recommend_hospital(incident.id)
        message = (
            f"Pickup confirmed! Multi-Criteria Hospital Recommendation executed. "
            f"Destination hospital assigned: {incident.destination_hospital_id}. "
            f"Stage 2 route generated."
        )

    # When driver completes arrival at hospital
    elif payload.status in [AmbulanceStatus.ARRIVED_AT_HOSPITAL, AmbulanceStatus.AVAILABLE] and incident:
        incident = db.complete_emergency(incident.id)
        message = "Ambulance arrived at destination hospital. Emergency transport completed successfully."

    return {
        "success": True,
        "message": message,
        "ambulance": ambulance,
        "emergency": incident
    }

@router.post("/location")
def update_driver_location(
    payload: DriverLocationUpdateRequest,
    driver: Dict[str, Any] = Depends(require_driver)
) -> Dict[str, Any]:
    """
    Ambulance Driver Endpoint (Login required).
    Update current GPS telemetry of the ambulance.
    """
    ambulance = db.get_driver_ambulance(driver["id"])
    if not ambulance and driver.get("ambulance_id"):
        ambulance = db.get_ambulance(driver["ambulance_id"])

    if not ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver does not have an assigned ambulance."
        )

    ambulance.current_location = payload.current_coordinate

    return {
        "success": True,
        "ambulance_id": ambulance.id,
        "updated_location": ambulance.current_location
    }

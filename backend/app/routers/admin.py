from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from app.models.schemas import AmbulanceStation, Ambulance, Hospital, EmergencyIncident
from app.core.auth import require_admin
from app.data.database import db

router = APIRouter(prefix="/admin", tags=["Ambulance Station Admin"])

@router.get("/overview")
def get_admin_dashboard_overview(admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    """
    Ambulance Station Admin Endpoint (Login required).
    System-wide live operational telemetry for emergency command center.
    """
    stations = db.get_all_stations()
    ambulances = db.get_all_ambulances()
    emergencies = db.get_all_emergencies()
    hospitals = db.get_all_hospitals()

    total_ambs = len(ambulances)
    avail_ambs = sum(1 for a in ambulances if a.status == "AVAILABLE")
    active_incidents = sum(1 for e in emergencies if e.journey_stage not in ["COMPLETED", "CANCELLED"])
    total_icu_avail = sum(h.available_icu_beds for h in hospitals)
    total_er_avail = sum(h.available_er_beds for h in hospitals)

    return {
        "admin_name": admin["name"],
        "metrics": {
            "total_ambulances": total_ambs,
            "available_ambulances": avail_ambs,
            "dispatched_ambulances": total_ambs - avail_ambs,
            "active_emergencies": active_incidents,
            "total_hospitals": len(hospitals),
            "available_icu_beds": total_icu_avail,
            "available_er_beds": total_er_avail
        },
        "recent_emergencies": emergencies[:5]
    }

@router.get("/stations", response_model=List[AmbulanceStation])
def list_stations(admin: Dict[str, Any] = Depends(require_admin)):
    """List all ambulance dispatch stations and live availability."""
    return db.get_all_stations()

@router.get("/ambulances", response_model=List[Ambulance])
def list_ambulances(admin: Dict[str, Any] = Depends(require_admin)):
    """List fleet of ambulances with their equipment, statuses, and locations."""
    return db.get_all_ambulances()

@router.get("/emergencies", response_model=List[EmergencyIncident])
def list_emergencies(admin: Dict[str, Any] = Depends(require_admin)):
    """List all incoming and ongoing emergency journeys."""
    return db.get_all_emergencies()

@router.get("/hospitals", response_model=List[Hospital])
def list_hospitals(admin: Dict[str, Any] = Depends(require_admin)):
    """List destination hospitals, specialties, and real-time bed capacities."""
    return db.get_all_hospitals()

@router.put("/hospitals/{hospital_id}/capacity")
def update_hospital_capacity(
    hospital_id: str,
    available_icu_beds: int,
    available_er_beds: int,
    admin: Dict[str, Any] = Depends(require_admin)
) -> Dict[str, Any]:
    """Dynamically update ICU / ER bed count for a hospital."""
    hosp = db.update_hospital_capacity(hospital_id, available_icu_beds, available_er_beds)
    if not hosp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    return {
        "success": True,
        "message": f"Updated {hosp.name} capacities: {available_icu_beds} ICU, {available_er_beds} ER available.",
        "hospital": hosp
    }

@router.post("/system/reset")
def reset_system_data(admin: Dict[str, Any] = Depends(require_admin)) -> Dict[str, Any]:
    """Reset the entire simulation state to pristine seed data (stations, fleet, hospitals, routes)."""
    db.reset_to_seeds()
    return {
        "success": True,
        "message": "System state successfully reinitialized to demo seed baseline."
    }

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from app.models.schemas import RoadblockToggleRequest, TrafficCongestionRequest
from app.core.auth import get_current_user
from app.data.database import db

router = APIRouter(prefix="/simulate", tags=["Dynamic Simulation & Rerouting"])

@router.post("/roadblock")
def toggle_roadblock(
    payload: RoadblockToggleRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Simulation Endpoint (Station Admin or Authenticated User).
    Simulate a sudden roadblock (accident, tree fall, waterlogging, construction).
    
    CRITICAL FEATURE:
    If any active ambulance has a calculated route through this blocked edge,
    the system IMMEDIATELY triggers Dynamic Bidirectional A* Rerouting, computes
    the optimal bypass detour, updates the ETA, and logs the detour reason.
    """
    u, v = payload.u_node, payload.v_node
    if u not in db.nodes or v not in db.nodes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid node identifiers: {u} or {v} do not exist in road network."
        )

    rerouted_incident_ids = db.toggle_roadblock_and_reroute(
        u=u,
        v=v,
        is_blocked=payload.is_blocked,
        reason=payload.reason or "Simulated Obstacle"
    )

    action_text = "blocked" if payload.is_blocked else "cleared / reopened"
    rerouted_details = [db.get_emergency(i) for i in rerouted_incident_ids if db.get_emergency(i)]

    return {
        "success": True,
        "message": f"Road segment {u} <-> {v} has been {action_text}.",
        "affected_segment": {"u": u, "v": v, "is_blocked": payload.is_blocked},
        "rerouted_incidents_count": len(rerouted_incident_ids),
        "rerouted_incidents": rerouted_details
    }

@router.post("/traffic")
def update_traffic_congestion(
    payload: TrafficCongestionRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Simulation Endpoint (Station Admin or Authenticated User).
    Dynamically alter traffic conditions on an edge (1.0 = free flow, 0.25 = heavy gridlock).
    If congestion is severe, active journeys are dynamically re-routed.
    """
    u, v = payload.u_node, payload.v_node
    if u not in db.nodes or v not in db.nodes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid node identifiers: {u} or {v} do not exist in road network."
        )

    rerouted_ids = db.update_traffic_and_reroute(u, v, payload.traffic_factor)

    return {
        "success": True,
        "message": f"Traffic factor on {u} <-> {v} set to {payload.traffic_factor}.",
        "rerouted_incidents_count": len(rerouted_ids),
        "rerouted_incident_ids": rerouted_ids
    }

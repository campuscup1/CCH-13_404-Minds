from typing import List, Optional, Tuple
from app.models.schemas import (
    Ambulance, Coordinate, SeverityLevel, EmergencyCategory, 
    AmbulanceType, AmbulanceStatus, RouteInfo
)
from app.algorithms.routing import DynamicRoutingEngine

class AmbulanceDispatchOptimizer:
    """
    Intelligent Ambulance Dispatch Optimizer.
    
    Selects the optimal available ambulance using:
    1. Capability Matching (e.g. ALS with ventilators/defibrillators for Critical/Cardiac/Trauma)
    2. Estimated Response Time (ERT) computed via Bidirectional A* over the road network
    """

    def __init__(self, routing_engine: DynamicRoutingEngine):
        self.routing_engine = routing_engine

    def select_best_ambulance(
        self,
        pickup_coord: Coordinate,
        severity: SeverityLevel,
        category: EmergencyCategory,
        available_ambulances: List[Ambulance]
    ) -> Optional[Tuple[Ambulance, RouteInfo]]:
        """
        Evaluate idle ambulances and select the one with minimal response time
        and proper medical equipment.
        """
        if not available_ambulances:
            return None

        # Determine preference for ALS vs BLS
        prefer_als = (severity == SeverityLevel.CRITICAL) or (category in [EmergencyCategory.CARDIAC, EmergencyCategory.TRAUMA])

        # Separate into candidate pools
        als_pool = [a for a in available_ambulances if a.vehicle_type == AmbulanceType.ALS and a.status == AmbulanceStatus.AVAILABLE]
        bls_pool = [a for a in available_ambulances if a.vehicle_type == AmbulanceType.BLS and a.status == AmbulanceStatus.AVAILABLE]

        candidate_pool = []
        if prefer_als:
            candidate_pool = als_pool if als_pool else bls_pool
        else:
            candidate_pool = bls_pool if bls_pool else als_pool

        if not candidate_pool:
            return None

        best_ambulance: Optional[Ambulance] = None
        best_route: Optional[RouteInfo] = None
        min_eta_minutes = float('inf')

        for ambulance in candidate_pool:
            route = self.routing_engine.compute_route(
                origin_coord=ambulance.current_location,
                dest_coord=pickup_coord
            )

            if route:
                eta = route.total_duration_minutes
                if eta < min_eta_minutes:
                    min_eta_minutes = eta
                    best_ambulance = ambulance
                    best_route = route

        if best_ambulance and best_route:
            return best_ambulance, best_route

        # Fallback if graph route failed for candidate pool, evaluate any available ambulance
        for ambulance in available_ambulances:
            route = self.routing_engine.compute_route(ambulance.current_location, pickup_coord)
            if route and route.total_duration_minutes < min_eta_minutes:
                min_eta_minutes = route.total_duration_minutes
                best_ambulance = ambulance
                best_route = route

        if best_ambulance and best_route:
            return best_ambulance, best_route

        return None

import copy
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.models.schemas import (
    AmbulanceStation, Ambulance, Hospital, EmergencyIncident, 
    Coordinate, AmbulanceStatus, JourneyStage, EmergencyCategory, 
    SeverityLevel, AmbulanceType, RouteInfo, HospitalRecommendationScore
)
from app.data.seed_data import (
    SEED_NODES, SEED_EDGES, SEED_STATIONS, SEED_AMBULANCES, 
    SEED_HOSPITALS, SEED_USERS
)
from app.algorithms.routing import DynamicRoutingEngine
from app.algorithms.dispatch import AmbulanceDispatchOptimizer
from app.algorithms.recommendation import HospitalRecommendationEngine

class InMemoryDatabase:
    """Thread-safe In-Memory State Store managing the complete lifecycle of emergency dispatch."""

    def __init__(self):
        self.reset_to_seeds()

    def reset_to_seeds(self):
        # Deep copies of graph data
        self.nodes: Dict[str, Dict[str, Any]] = copy.deepcopy(SEED_NODES)
        self.edges: List[Dict[str, Any]] = copy.deepcopy(SEED_EDGES)

        # Initialize engines
        self.routing_engine = DynamicRoutingEngine(self.nodes, self.edges)
        self.dispatch_optimizer = AmbulanceDispatchOptimizer(self.routing_engine)
        self.recommendation_engine = HospitalRecommendationEngine(self.routing_engine)

        # Initialize entities
        self.users: Dict[str, Dict[str, Any]] = {u["id"]: copy.deepcopy(u) for u in SEED_USERS}
        self.username_index: Dict[str, str] = {u["username"]: u["id"] for u in SEED_USERS}

        self.stations: Dict[str, AmbulanceStation] = {
            s["id"]: AmbulanceStation(
                id=s["id"],
                name=s["name"],
                address=s["address"],
                coordinate=Coordinate(**s["coordinate"]),
                total_ambulances=s["total_ambulances"],
                available_ambulances=s["available_ambulances"]
            ) for s in SEED_STATIONS
        }

        self.ambulances: Dict[str, Ambulance] = {
            a["id"]: Ambulance(
                id=a["id"],
                vehicle_number=a["vehicle_number"],
                vehicle_type=a["vehicle_type"],
                status=a["status"],
                station_id=a["station_id"],
                assigned_driver_id=a["assigned_driver_id"],
                current_location=Coordinate(**a["current_location"]),
                equipment=a["equipment"],
                active_emergency_id=None
            ) for a in SEED_AMBULANCES
        }

        self.hospitals: Dict[str, Hospital] = {
            h["id"]: Hospital(
                id=h["id"],
                name=h["name"],
                address=h["address"],
                coordinate=Coordinate(**h["coordinate"]),
                specialties=h["specialties"],
                total_icu_beds=h["total_icu_beds"],
                available_icu_beds=h["available_icu_beds"],
                total_er_beds=h["total_er_beds"],
                available_er_beds=h["available_er_beds"],
                burn_unit_available=h["burn_unit_available"],
                trauma_level=h["trauma_level"],
                contact_phone=h["contact_phone"]
            ) for h in SEED_HOSPITALS
        }

        self.emergencies: Dict[str, EmergencyIncident] = {}

    # User lookup
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        user_id = self.username_index.get(username)
        if user_id:
            return self.users.get(user_id)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.users.get(user_id)

    # Station operations
    def get_all_stations(self) -> List[AmbulanceStation]:
        # Update dynamic count
        for station_id, station in self.stations.items():
            avail = sum(1 for a in self.ambulances.values() if a.station_id == station_id and a.status == AmbulanceStatus.AVAILABLE)
            tot = sum(1 for a in self.ambulances.values() if a.station_id == station_id)
            station.available_ambulances = avail
            station.total_ambulances = tot
        return list(self.stations.values())

    # Ambulance operations
    def get_all_ambulances(self) -> List[Ambulance]:
        return list(self.ambulances.values())

    def get_ambulance(self, ambulance_id: str) -> Optional[Ambulance]:
        return self.ambulances.get(ambulance_id)

    def get_driver_ambulance(self, driver_id: str) -> Optional[Ambulance]:
        for amb in self.ambulances.values():
            if amb.assigned_driver_id == driver_id:
                return amb
        return None

    # Hospital operations
    def get_all_hospitals(self) -> List[Hospital]:
        return list(self.hospitals.values())

    def get_hospital(self, hospital_id: str) -> Optional[Hospital]:
        return self.hospitals.get(hospital_id)

    def update_hospital_capacity(self, hospital_id: str, available_icu: int, available_er: int) -> Optional[Hospital]:
        hosp = self.hospitals.get(hospital_id)
        if hosp:
            hosp.available_icu_beds = max(0, min(hosp.total_icu_beds, available_icu))
            hosp.available_er_beds = max(0, min(hosp.total_er_beds, available_er))
            return hosp
        return None

    # Emergency Dispatch Lifecycle
    def create_emergency_and_dispatch(
        self,
        caller_name: str,
        caller_phone: str,
        patient_name: str,
        category: EmergencyCategory,
        severity: SeverityLevel,
        description: str,
        pickup_address: str,
        pickup_coord: Coordinate
    ) -> EmergencyIncident:
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        nearest_node = self.routing_engine.find_nearest_node(pickup_coord)

        incident = EmergencyIncident(
            id=incident_id,
            caller_name=caller_name,
            caller_phone=caller_phone,
            patient_name=patient_name or "Emergency Patient",
            category=category,
            severity=severity,
            description=description,
            pickup_address=pickup_address,
            pickup_coordinate=pickup_coord,
            nearest_node_id=nearest_node,
            journey_stage=JourneyStage.PENDING_DISPATCH
        )

        # Dispatch selection
        available_ambs = [a for a in self.ambulances.values() if a.status == AmbulanceStatus.AVAILABLE]
        dispatch_result = self.dispatch_optimizer.select_best_ambulance(
            pickup_coord=pickup_coord,
            severity=severity,
            category=category,
            available_ambulances=available_ambs
        )

        if dispatch_result:
            assigned_amb, route_stage1 = dispatch_result
            incident.assigned_ambulance_id = assigned_amb.id
            incident.assigned_station_id = assigned_amb.station_id
            incident.journey_stage = JourneyStage.STAGE_1_DISPATCH_TO_PATIENT
            incident.stage1_route = route_stage1

            # Update ambulance state
            assigned_amb.status = AmbulanceStatus.DISPATCHED
            assigned_amb.active_emergency_id = incident.id
        
        self.emergencies[incident_id] = incident
        return incident

    def get_emergency(self, emergency_id: str) -> Optional[EmergencyIncident]:
        return self.emergencies.get(emergency_id)

    def get_all_emergencies(self) -> List[EmergencyIncident]:
        return sorted(list(self.emergencies.values()), key=lambda e: e.created_at, reverse=True)

    def confirm_pickup_and_recommend_hospital(self, emergency_id: str) -> Optional[EmergencyIncident]:
        """
        Stage transition: Patient Pickup Confirmed.
        Triggers Stage 2:
        1. Hospital Recommendation Engine scores all hospitals.
        2. Assigns top hospital as destination.
        3. Computes Stage 2 Route (Patient Location -> Recommended Hospital).
        """
        incident = self.emergencies.get(emergency_id)
        if not incident:
            return None

        incident.pickup_confirmed_at = datetime.utcnow()
        incident.journey_stage = JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL

        # Update assigned ambulance status
        if incident.assigned_ambulance_id:
            amb = self.ambulances.get(incident.assigned_ambulance_id)
            if amb:
                amb.status = AmbulanceStatus.EN_ROUTE_TO_HOSPITAL

        # Hospital Recommendation
        ranked_hospitals = self.recommendation_engine.rank_hospitals(
            patient_coord=incident.pickup_coordinate,
            category=incident.category,
            severity=incident.severity,
            hospitals=list(self.hospitals.values())
        )

        incident.hospital_recommendations = ranked_hospitals

        if ranked_hospitals:
            top_rec = ranked_hospitals[0]
            incident.destination_hospital_id = top_rec.hospital.id
            incident.stage2_route = top_rec.recommended_route

        return incident

    def complete_emergency(self, emergency_id: str) -> Optional[EmergencyIncident]:
        """Mark journey as completed upon arrival at destination hospital."""
        incident = self.emergencies.get(emergency_id)
        if not incident:
            return None

        incident.completed_at = datetime.utcnow()
        incident.journey_stage = JourneyStage.COMPLETED

        if incident.assigned_ambulance_id:
            amb = self.ambulances.get(incident.assigned_ambulance_id)
            if amb:
                amb.status = AmbulanceStatus.AVAILABLE
                amb.active_emergency_id = None
                # Set location to hospital destination
                if incident.destination_hospital_id:
                    hosp = self.hospitals.get(incident.destination_hospital_id)
                    if hosp:
                        amb.current_location = hosp.coordinate

        return incident

    # Dynamic Traffic & Roadblock Recalculation
    def toggle_roadblock_and_reroute(self, u: str, v: str, is_blocked: bool, reason: str = "Road obstruction") -> List[str]:
        """
        Blocks or unblocks a road edge.
        If blocked, checks all active emergencies with active routes traversing (u, v) or (v, u),
        and triggers automatic route recalculation using Bidirectional A*.
        Returns list of emergency IDs that were rerouted.
        """
        self.routing_engine.set_roadblock(u, v, is_blocked)
        rerouted_incidents: List[str] = []

        if not is_blocked:
            return rerouted_incidents

        # Check which active journeys are affected
        for inc_id, inc in self.emergencies.items():
            if inc.journey_stage in [JourneyStage.STAGE_1_DISPATCH_TO_PATIENT, JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL]:
                active_route = inc.stage1_route if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT else inc.stage2_route
                if not active_route:
                    continue

                # Check if edge (u, v) or (v, u) is in route path
                path = active_route.path_nodes
                has_edge = any((path[i] == u and path[i+1] == v) or (path[i] == v and path[i+1] == u) for i in range(len(path)-1))

                if has_edge:
                    amb = self.ambulances.get(inc.assigned_ambulance_id) if inc.assigned_ambulance_id else None
                    curr_coord = amb.current_location if amb else inc.pickup_coordinate

                    if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT:
                        new_route = self.routing_engine.compute_route(
                            origin_coord=curr_coord,
                            dest_coord=inc.pickup_coordinate,
                            is_reroute=True,
                            reroute_reason=f"Dynamic detour: Roadblock reported between {u} and {v} ({reason})"
                        )
                        if new_route:
                            inc.stage1_route = new_route
                            rerouted_incidents.append(inc_id)

                    elif inc.journey_stage == JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL:
                        dest_hosp = self.hospitals.get(inc.destination_hospital_id)
                        if dest_hosp:
                            new_route = self.routing_engine.compute_route(
                                origin_coord=curr_coord,
                                dest_coord=dest_hosp.coordinate,
                                is_reroute=True,
                                reroute_reason=f"Dynamic detour: Roadblock reported between {u} and {v} ({reason})"
                            )
                            if new_route:
                                inc.stage2_route = new_route
                                rerouted_incidents.append(inc_id)

        return rerouted_incidents

    def update_traffic_and_reroute(self, u: str, v: str, traffic_factor: float) -> List[str]:
        """Update traffic condition and optionally re-evaluate routes for active journeys."""
        self.routing_engine.set_traffic_factor(u, v, traffic_factor)
        # Re-evaluate active journeys if severe traffic (<= 0.3)
        rerouted = []
        if traffic_factor <= 0.35:
            # Check active emergencies and recalculate
            for inc_id, inc in self.emergencies.items():
                if inc.journey_stage in [JourneyStage.STAGE_1_DISPATCH_TO_PATIENT, JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL]:
                    active_route = inc.stage1_route if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT else inc.stage2_route
                    if active_route:
                        path = active_route.path_nodes
                        has_edge = any((path[i] == u and path[i+1] == v) or (path[i] == v and path[i+1] == u) for i in range(len(path)-1))
                        if has_edge:
                            amb = self.ambulances.get(inc.assigned_ambulance_id) if inc.assigned_ambulance_id else None
                            curr_coord = amb.current_location if amb else inc.pickup_coordinate
                            target_coord = inc.pickup_coordinate if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT else (self.hospitals[inc.destination_hospital_id].coordinate if inc.destination_hospital_id else None)
                            if target_coord:
                                new_route = self.routing_engine.compute_route(
                                    origin_coord=curr_coord,
                                    dest_coord=target_coord,
                                    is_reroute=True,
                                    reroute_reason=f"Congestion update: Heavy traffic (speed index {traffic_factor}) on {u}-{v}"
                                )
                                if new_route:
                                    if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT:
                                        inc.stage1_route = new_route
                                    else:
                                        inc.stage2_route = new_route
                                    rerouted.append(inc_id)
        return rerouted

# Global in-memory singleton
db = InMemoryDatabase()

from typing import List, Dict, Any, Optional
from app.models.schemas import (
    Hospital, HospitalRecommendationScore, Coordinate, 
    EmergencyCategory, SeverityLevel, RouteInfo
)
from app.algorithms.routing import DynamicRoutingEngine

class HospitalRecommendationEngine:
    """
    Multi-Criteria Decision Making (MCDM) Engine for Hospital Selection.
    
    Considers 3 key weighted dimensions:
    1. Specialty Alignment (Trauma, Cardiac, Pediatric, Neurological, Respiratory, General)
    2. Real-time Bed & Critical Care Capacity (ICU Beds + ER Beds availability ratio)
    3. Estimated Transit Time (dynamic ETA computed via Bidirectional A*)
    """

    def __init__(self, routing_engine: DynamicRoutingEngine):
        self.routing_engine = routing_engine

    def _calculate_specialty_score(self, hospital: Hospital, category: EmergencyCategory) -> float:
        """Score specialty match from 0 to 100."""
        if category in hospital.specialties:
            # Exact specialty match
            if category == EmergencyCategory.TRAUMA and hospital.trauma_level == 1:
                return 100.0
            return 95.0
        elif EmergencyCategory.GENERAL in hospital.specialties:
            # General hospital fallback
            return 45.0
        return 15.0

    def _calculate_bed_capacity_score(self, hospital: Hospital, severity: SeverityLevel) -> float:
        """
        Score capacity based on ICU and ER beds.
        Critical emergencies place 70% weight on ICU availability.
        """
        icu_ratio = hospital.available_icu_beds / max(1, hospital.total_icu_beds)
        er_ratio = hospital.available_er_beds / max(1, hospital.total_er_beds)

        if severity == SeverityLevel.CRITICAL:
            if hospital.available_icu_beds == 0:
                return 10.0  # heavy penalty if critical and zero ICU beds
            score = (icu_ratio * 70.0) + (er_ratio * 30.0)
        else:
            score = (icu_ratio * 40.0) + (er_ratio * 60.0)

        return round(score, 1)

    def rank_hospitals(
        self, 
        patient_coord: Coordinate, 
        category: EmergencyCategory, 
        severity: SeverityLevel,
        hospitals: List[Hospital]
    ) -> List[HospitalRecommendationScore]:
        """Rank all candidate hospitals and produce detailed score breakdown."""
        scored_hospitals: List[HospitalRecommendationScore] = []

        # Weights configuration
        if severity == SeverityLevel.CRITICAL:
            w_spec = 0.40
            w_cap = 0.35
            w_time = 2.0  # penalize travel minutes
        else:
            w_spec = 0.30
            w_cap = 0.30
            w_time = 3.0

        for hosp in hospitals:
            specialty_score = self._calculate_specialty_score(hosp, category)
            bed_score = self._calculate_bed_capacity_score(hosp, severity)

            # Compute actual dynamic route from patient to this hospital
            route: Optional[RouteInfo] = self.routing_engine.compute_route(
                origin_coord=patient_coord, 
                dest_coord=hosp.coordinate
            )

            if route:
                eta_minutes = route.total_duration_minutes
                dist_km = route.total_distance_km
            else:
                eta_minutes = 999.0
                dist_km = 999.0

            # Composite formula: higher is better
            time_penalty = eta_minutes * w_time
            composite = (specialty_score * w_spec) + (bed_score * w_cap) - time_penalty
            composite = max(0.0, round(composite, 2))

            # Justification message
            reasons = []
            if category in hosp.specialties:
                reasons.append(f"Specialized {category.value} care unit active")
            else:
                reasons.append("General emergency capability")

            reasons.append(f"{hosp.available_icu_beds} ICU / {hosp.available_er_beds} ER beds open")
            reasons.append(f"ETA: {eta_minutes} min ({dist_km} km)")
            justification = "; ".join(reasons)

            scored_hospitals.append(
                HospitalRecommendationScore(
                    hospital=hosp,
                    specialty_match_score=specialty_score,
                    bed_capacity_score=bed_score,
                    eta_minutes=eta_minutes,
                    distance_km=dist_km,
                    composite_score=composite,
                    reason=justification,
                    recommended_route=route
                )
            )

        # Sort descending by composite score
        scored_hospitals.sort(key=lambda x: x.composite_score, reverse=True)
        return scored_hospitals

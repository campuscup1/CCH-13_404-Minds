import os
import sqlite3
import json
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

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "emergency.db")

def serialize_json(obj: Any) -> Optional[str]:
    """Helper to safely serialize Pydantic models or dicts containing datetimes."""
    if obj is None:
        return None
    if hasattr(obj, "model_dump_json"):
        return obj.model_dump_json()
    if hasattr(obj, "dict"):
        return json.dumps(obj.dict(), default=str)
    return json.dumps(obj, default=str)

class SQLiteDatabase:
    """
    Persistent SQLite Database with In-Memory Graph Acceleration.
    - Persists all users, fleet states, hospital capacities, emergencies, and roadblocks to SQLite.
    - Automatically checks on startup: Seeds demo data ONLY ONCE if tables are empty.
    - Preserves modified data across backend restarts.
    """

    def __init__(self, db_file: str = DB_PATH):
        self.db_file = db_file
        self._init_sqlite_schema()
        self._seed_if_empty()
        self._load_state_from_sqlite()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite_schema(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Users
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                station_id TEXT,
                ambulance_id TEXT
            )
            """)

            # Stations
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS stations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                node_id TEXT NOT NULL,
                total_ambulances INTEGER NOT NULL,
                available_ambulances INTEGER NOT NULL
            )
            """)

            # Ambulances
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS ambulances (
                id TEXT PRIMARY KEY,
                vehicle_number TEXT NOT NULL,
                vehicle_type TEXT NOT NULL,
                status TEXT NOT NULL,
                station_id TEXT NOT NULL,
                assigned_driver_id TEXT,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                current_node_id TEXT,
                equipment TEXT NOT NULL,
                active_emergency_id TEXT
            )
            """)

            # Hospitals
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS hospitals (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                node_id TEXT NOT NULL,
                specialties TEXT NOT NULL,
                total_icu_beds INTEGER NOT NULL,
                available_icu_beds INTEGER NOT NULL,
                total_er_beds INTEGER NOT NULL,
                available_er_beds INTEGER NOT NULL,
                burn_unit_available INTEGER NOT NULL,
                trauma_level INTEGER NOT NULL,
                contact_phone TEXT NOT NULL
            )
            """)

            # Road Network Nodes
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS road_nodes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lon REAL NOT NULL
            )
            """)

            # Road Network Edges
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS road_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                u TEXT NOT NULL,
                v TEXT NOT NULL,
                road_name TEXT NOT NULL,
                speed_kmh REAL NOT NULL,
                traffic_factor REAL NOT NULL,
                is_blocked INTEGER NOT NULL,
                distance_meters REAL
            )
            """)

            # Emergencies
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS emergencies (
                id TEXT PRIMARY KEY,
                caller_name TEXT NOT NULL,
                caller_phone TEXT NOT NULL,
                patient_name TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                pickup_address TEXT NOT NULL,
                pickup_lat REAL NOT NULL,
                pickup_lon REAL NOT NULL,
                nearest_node_id TEXT NOT NULL,
                journey_stage TEXT NOT NULL,
                assigned_ambulance_id TEXT,
                assigned_station_id TEXT,
                destination_hospital_id TEXT,
                stage1_route TEXT,
                stage2_route TEXT,
                hospital_recommendations TEXT,
                created_at TEXT NOT NULL,
                pickup_confirmed_at TEXT,
                completed_at TEXT
            )
            """)
            conn.commit()

    def _seed_if_empty(self):
        """Seed demo data ONLY if SQLite database tables are empty."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]

            if user_count > 0:
                print(f"[SQLite] Existing database detected at '{self.db_file}' with existing data. Skipping seed.")
                return

            print(f"[SQLite] First-time run: Seeding pristine demo dataset into '{self.db_file}'...")
            
            # Seed Users
            for u in SEED_USERS:
                cursor.execute("""
                INSERT INTO users (id, username, password_hash, name, role, station_id, ambulance_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (u["id"], u["username"], u["password_hash"], u["name"], u["role"].value, u.get("station_id"), u.get("ambulance_id")))

            # Seed Stations
            for s in SEED_STATIONS:
                cursor.execute("""
                INSERT INTO stations (id, name, address, lat, lon, node_id, total_ambulances, available_ambulances)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (s["id"], s["name"], s["address"], s["coordinate"]["lat"], s["coordinate"]["lon"], s["node_id"], s["total_ambulances"], s["available_ambulances"]))

            # Seed Ambulances
            for a in SEED_AMBULANCES:
                cursor.execute("""
                INSERT INTO ambulances (id, vehicle_number, vehicle_type, status, station_id, assigned_driver_id, lat, lon, current_node_id, equipment, active_emergency_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    a["id"], a["vehicle_number"], a["vehicle_type"].value, a["status"].value,
                    a["station_id"], a.get("assigned_driver_id"), a["current_location"]["lat"],
                    a["current_location"]["lon"], a.get("current_node_id"), json.dumps(a["equipment"]), None
                ))

            # Seed Hospitals
            for h in SEED_HOSPITALS:
                specs = [spec.value if hasattr(spec, "value") else spec for spec in h["specialties"]]
                cursor.execute("""
                INSERT INTO hospitals (id, name, address, lat, lon, node_id, specialties, total_icu_beds, available_icu_beds, total_er_beds, available_er_beds, burn_unit_available, trauma_level, contact_phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    h["id"], h["name"], h["address"], h["coordinate"]["lat"], h["coordinate"]["lon"],
                    h["node_id"], json.dumps(specs), h["total_icu_beds"], h["available_icu_beds"],
                    h["total_er_beds"], h["available_er_beds"], 1 if h["burn_unit_available"] else 0,
                    h["trauma_level"], h["contact_phone"]
                ))

            # Seed Road Nodes
            for n_id, n_data in SEED_NODES.items():
                cursor.execute("""
                INSERT INTO road_nodes (id, name, lat, lon)
                VALUES (?, ?, ?, ?)
                """, (n_id, n_data["name"], n_data["lat"], n_data["lon"]))

            # Seed Road Edges
            for e in SEED_EDGES:
                cursor.execute("""
                INSERT INTO road_edges (u, v, road_name, speed_kmh, traffic_factor, is_blocked, distance_meters)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (e["u"], e["v"], e["road_name"], e["speed_kmh"], e["traffic_factor"], 1 if e["is_blocked"] else 0, e.get("distance_meters")))

            conn.commit()
            print("[SQLite] Demo seed data successfully written to SQLite database.")

    def _load_state_from_sqlite(self):
        """Loads cached entities and initializes routing engines from SQLite."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Load Nodes
            cursor.execute("SELECT id, name, lat, lon FROM road_nodes")
            self.nodes = {row["id"]: {"id": row["id"], "name": row["name"], "lat": row["lat"], "lon": row["lon"]} for row in cursor.fetchall()}

            # Load Edges
            cursor.execute("SELECT u, v, road_name, speed_kmh, traffic_factor, is_blocked, distance_meters FROM road_edges")
            self.edges = [
                {
                    "u": row["u"],
                    "v": row["v"],
                    "road_name": row["road_name"],
                    "speed_kmh": row["speed_kmh"],
                    "traffic_factor": row["traffic_factor"],
                    "is_blocked": bool(row["is_blocked"]),
                    "distance_meters": row["distance_meters"]
                }
                for row in cursor.fetchall()
            ]

            # Initialize Algorithms with graph from SQLite
            self.routing_engine = DynamicRoutingEngine(self.nodes, self.edges)
            self.dispatch_optimizer = AmbulanceDispatchOptimizer(self.routing_engine)
            self.recommendation_engine = HospitalRecommendationEngine(self.routing_engine)

            # Load Users
            cursor.execute("SELECT id, username, password_hash, name, role, station_id, ambulance_id FROM users")
            self.users = {}
            self.username_index = {}
            for row in cursor.fetchall():
                u_dict = dict(row)
                self.users[u_dict["id"]] = u_dict
                self.username_index[u_dict["username"]] = u_dict["id"]

            # Load Stations
            cursor.execute("SELECT id, name, address, lat, lon, total_ambulances, available_ambulances FROM stations")
            self.stations = {
                row["id"]: AmbulanceStation(
                    id=row["id"],
                    name=row["name"],
                    address=row["address"],
                    coordinate=Coordinate(lat=row["lat"], lon=row["lon"]),
                    total_ambulances=row["total_ambulances"],
                    available_ambulances=row["available_ambulances"]
                ) for row in cursor.fetchall()
            }

            # Load Ambulances
            cursor.execute("SELECT id, vehicle_number, vehicle_type, status, station_id, assigned_driver_id, lat, lon, equipment, active_emergency_id FROM ambulances")
            self.ambulances = {
                row["id"]: Ambulance(
                    id=row["id"],
                    vehicle_number=row["vehicle_number"],
                    vehicle_type=AmbulanceType(row["vehicle_type"]),
                    status=AmbulanceStatus(row["status"]),
                    station_id=row["station_id"],
                    assigned_driver_id=row["assigned_driver_id"],
                    current_location=Coordinate(lat=row["lat"], lon=row["lon"]),
                    equipment=json.loads(row["equipment"]),
                    active_emergency_id=row["active_emergency_id"]
                ) for row in cursor.fetchall()
            }

            # Load Hospitals
            cursor.execute("SELECT id, name, address, lat, lon, specialties, total_icu_beds, available_icu_beds, total_er_beds, available_er_beds, burn_unit_available, trauma_level, contact_phone FROM hospitals")
            self.hospitals = {
                row["id"]: Hospital(
                    id=row["id"],
                    name=row["name"],
                    address=row["address"],
                    coordinate=Coordinate(lat=row["lat"], lon=row["lon"]),
                    specialties=[EmergencyCategory(s) for s in json.loads(row["specialties"])],
                    total_icu_beds=row["total_icu_beds"],
                    available_icu_beds=row["available_icu_beds"],
                    total_er_beds=row["total_er_beds"],
                    available_er_beds=row["available_er_beds"],
                    burn_unit_available=bool(row["burn_unit_available"]),
                    trauma_level=row["trauma_level"],
                    contact_phone=row["contact_phone"]
                ) for row in cursor.fetchall()
            }

            # Load Emergencies
            cursor.execute("""
            SELECT id, caller_name, caller_phone, patient_name, category, severity, description,
                   pickup_address, pickup_lat, pickup_lon, nearest_node_id, journey_stage,
                   assigned_ambulance_id, assigned_station_id, destination_hospital_id,
                   stage1_route, stage2_route, hospital_recommendations, created_at, pickup_confirmed_at, completed_at
            FROM emergencies
            """)
            self.emergencies = {}
            for row in cursor.fetchall():
                inc = EmergencyIncident(
                    id=row["id"],
                    caller_name=row["caller_name"],
                    caller_phone=row["caller_phone"],
                    patient_name=row["patient_name"],
                    category=EmergencyCategory(row["category"]),
                    severity=SeverityLevel(row["severity"]),
                    description=row["description"],
                    pickup_address=row["pickup_address"],
                    pickup_coordinate=Coordinate(lat=row["pickup_lat"], lon=row["pickup_lon"]),
                    nearest_node_id=row["nearest_node_id"],
                    journey_stage=JourneyStage(row["journey_stage"]),
                    assigned_ambulance_id=row["assigned_ambulance_id"],
                    assigned_station_id=row["assigned_station_id"],
                    destination_hospital_id=row["destination_hospital_id"],
                    stage1_route=RouteInfo(**json.loads(row["stage1_route"])) if row["stage1_route"] else None,
                    stage2_route=RouteInfo(**json.loads(row["stage2_route"])) if row["stage2_route"] else None,
                    hospital_recommendations=[HospitalRecommendationScore(**h) for h in json.loads(row["hospital_recommendations"])] if row["hospital_recommendations"] else [],
                    created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.utcnow(),
                    pickup_confirmed_at=datetime.fromisoformat(row["pickup_confirmed_at"]) if row["pickup_confirmed_at"] else None,
                    completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None
                )
                self.emergencies[inc.id] = inc

    # User lookup
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        user_id = self.username_index.get(username)
        return self.users.get(user_id) if user_id else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.users.get(user_id)

    # Stations
    def get_all_stations(self) -> List[AmbulanceStation]:
        for station_id, station in self.stations.items():
            avail = sum(1 for a in self.ambulances.values() if a.station_id == station_id and a.status == AmbulanceStatus.AVAILABLE)
            tot = sum(1 for a in self.ambulances.values() if a.station_id == station_id)
            station.available_ambulances = avail
            station.total_ambulances = tot
        return list(self.stations.values())

    # Ambulances
    def get_all_ambulances(self) -> List[Ambulance]:
        return list(self.ambulances.values())

    def get_ambulance(self, ambulance_id: str) -> Optional[Ambulance]:
        return self.ambulances.get(ambulance_id)

    def get_driver_ambulance(self, driver_id: str) -> Optional[Ambulance]:
        for amb in self.ambulances.values():
            if amb.assigned_driver_id == driver_id:
                return amb
        return None

    def update_ambulance_location(self, ambulance_id: str, coord: Coordinate):
        amb = self.ambulances.get(ambulance_id)
        if amb:
            amb.current_location = coord
            with self._get_connection() as conn:
                conn.cursor().execute("UPDATE ambulances SET lat = ?, lon = ? WHERE id = ?", (coord.lat, coord.lon, ambulance_id))
                conn.commit()

    def update_ambulance_status(self, ambulance_id: str, status: AmbulanceStatus):
        amb = self.ambulances.get(ambulance_id)
        if amb:
            amb.status = status
            with self._get_connection() as conn:
                conn.cursor().execute("UPDATE ambulances SET status = ? WHERE id = ?", (status.value, ambulance_id))
                conn.commit()

    # Hospitals
    def get_all_hospitals(self) -> List[Hospital]:
        return list(self.hospitals.values())

    def get_hospital(self, hospital_id: str) -> Optional[Hospital]:
        return self.hospitals.get(hospital_id)

    def update_hospital_capacity(self, hospital_id: str, available_icu: int, available_er: int) -> Optional[Hospital]:
        hosp = self.hospitals.get(hospital_id)
        if hosp:
            hosp.available_icu_beds = max(0, min(hosp.total_icu_beds, available_icu))
            hosp.available_er_beds = max(0, min(hosp.total_er_beds, available_er))
            with self._get_connection() as conn:
                conn.cursor().execute("""
                UPDATE hospitals SET available_icu_beds = ?, available_er_beds = ? WHERE id = ?
                """, (hosp.available_icu_beds, hosp.available_er_beds, hospital_id))
                conn.commit()
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

        # Persist to SQLite
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO emergencies (
                id, caller_name, caller_phone, patient_name, category, severity, description,
                pickup_address, pickup_lat, pickup_lon, nearest_node_id, journey_stage,
                assigned_ambulance_id, assigned_station_id, destination_hospital_id,
                stage1_route, stage2_route, hospital_recommendations, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                incident.id, incident.caller_name, incident.caller_phone, incident.patient_name,
                incident.category.value, incident.severity.value, incident.description,
                incident.pickup_address, incident.pickup_coordinate.lat, incident.pickup_coordinate.lon,
                incident.nearest_node_id, incident.journey_stage.value, incident.assigned_ambulance_id,
                incident.assigned_station_id, incident.destination_hospital_id,
                serialize_json(incident.stage1_route),
                None, None, incident.created_at.isoformat()
            ))
            if incident.assigned_ambulance_id:
                cursor.execute("""
                UPDATE ambulances SET status = ?, active_emergency_id = ? WHERE id = ?
                """, (AmbulanceStatus.DISPATCHED.value, incident.id, incident.assigned_ambulance_id))
            conn.commit()

        return incident

    def get_emergency(self, emergency_id: str) -> Optional[EmergencyIncident]:
        return self.emergencies.get(emergency_id)

    def get_all_emergencies(self) -> List[EmergencyIncident]:
        return sorted(list(self.emergencies.values()), key=lambda e: e.created_at, reverse=True)

    def confirm_pickup_and_recommend_hospital(self, emergency_id: str) -> Optional[EmergencyIncident]:
        incident = self.emergencies.get(emergency_id)
        if not incident:
            return None

        incident.pickup_confirmed_at = datetime.utcnow()
        incident.journey_stage = JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL

        if incident.assigned_ambulance_id:
            amb = self.ambulances.get(incident.assigned_ambulance_id)
            if amb:
                amb.status = AmbulanceStatus.EN_ROUTE_TO_HOSPITAL

        # Multi-Criteria Hospital Recommendation
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

        # Persist to SQLite
        with self._get_connection() as conn:
            cursor = conn.cursor()
            recs_json = json.dumps([h.dict() for h in incident.hospital_recommendations], default=str) if incident.hospital_recommendations else None
            cursor.execute("""
            UPDATE emergencies SET 
                journey_stage = ?, destination_hospital_id = ?, stage2_route = ?,
                hospital_recommendations = ?, pickup_confirmed_at = ?
            WHERE id = ?
            """, (
                incident.journey_stage.value, incident.destination_hospital_id,
                serialize_json(incident.stage2_route),
                recs_json,
                incident.pickup_confirmed_at.isoformat(), incident.id
            ))
            if incident.assigned_ambulance_id:
                cursor.execute("UPDATE ambulances SET status = ? WHERE id = ?", (AmbulanceStatus.EN_ROUTE_TO_HOSPITAL.value, incident.assigned_ambulance_id))
            conn.commit()

        return incident

    def complete_emergency(self, emergency_id: str) -> Optional[EmergencyIncident]:
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
                if incident.destination_hospital_id:
                    hosp = self.hospitals.get(incident.destination_hospital_id)
                    if hosp:
                        amb.current_location = hosp.coordinate

        # Persist to SQLite
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE emergencies SET journey_stage = ?, completed_at = ? WHERE id = ?
            """, (incident.journey_stage.value, incident.completed_at.isoformat(), incident.id))
            if incident.assigned_ambulance_id:
                amb = self.ambulances.get(incident.assigned_ambulance_id)
                cursor.execute("""
                UPDATE ambulances SET status = ?, active_emergency_id = ?, lat = ?, lon = ? WHERE id = ?
                """, (AmbulanceStatus.AVAILABLE.value, None, amb.current_location.lat, amb.current_location.lon, incident.assigned_ambulance_id))
            conn.commit()

        return incident

    # Dynamic Traffic & Roadblock Recalculation
    def toggle_roadblock_and_reroute(self, u: str, v: str, is_blocked: bool, reason: str = "Road obstruction") -> List[str]:
        self.routing_engine.set_roadblock(u, v, is_blocked)
        
        # Persist edge update to SQLite
        with self._get_connection() as conn:
            conn.cursor().execute("""
            UPDATE road_edges SET is_blocked = ? WHERE (u = ? AND v = ?) OR (u = ? AND v = ?)
            """, (1 if is_blocked else 0, u, v, v, u))
            conn.commit()

        rerouted_incidents: List[str] = []
        if not is_blocked:
            return rerouted_incidents

        for inc_id, inc in self.emergencies.items():
            if inc.journey_stage in [JourneyStage.STAGE_1_DISPATCH_TO_PATIENT, JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL]:
                active_route = inc.stage1_route if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT else inc.stage2_route
                if not active_route:
                    continue

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

                    # Persist rerouted route to SQLite
                    with self._get_connection() as conn:
                        cursor = conn.cursor()
                        if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT and inc.stage1_route:
                            cursor.execute("UPDATE emergencies SET stage1_route = ? WHERE id = ?", (serialize_json(inc.stage1_route), inc.id))
                        elif inc.journey_stage == JourneyStage.STAGE_2_PATIENT_TO_HOSPITAL and inc.stage2_route:
                            cursor.execute("UPDATE emergencies SET stage2_route = ? WHERE id = ?", (serialize_json(inc.stage2_route), inc.id))
                        conn.commit()

        return rerouted_incidents

    def update_traffic_and_reroute(self, u: str, v: str, traffic_factor: float) -> List[str]:
        self.routing_engine.set_traffic_factor(u, v, traffic_factor)

        # Persist edge update to SQLite
        with self._get_connection() as conn:
            conn.cursor().execute("""
            UPDATE road_edges SET traffic_factor = ? WHERE (u = ? AND v = ?) OR (u = ? AND v = ?)
            """, (traffic_factor, u, v, v, u))
            conn.commit()

        rerouted = []
        if traffic_factor <= 0.35:
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

                                    with self._get_connection() as conn:
                                        cursor = conn.cursor()
                                        if inc.journey_stage == JourneyStage.STAGE_1_DISPATCH_TO_PATIENT:
                                            cursor.execute("UPDATE emergencies SET stage1_route = ? WHERE id = ?", (serialize_json(inc.stage1_route), inc.id))
                                        else:
                                            cursor.execute("UPDATE emergencies SET stage2_route = ? WHERE id = ?", (serialize_json(inc.stage2_route), inc.id))
                                        conn.commit()
        return rerouted

    def reset_to_seeds(self):
        """Hard reset of SQLite tables to pristine seed baseline."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM emergencies")
            cursor.execute("DELETE FROM ambulances")
            cursor.execute("DELETE FROM stations")
            cursor.execute("DELETE FROM hospitals")
            cursor.execute("DELETE FROM road_edges")
            cursor.execute("DELETE FROM road_nodes")
            cursor.execute("DELETE FROM users")
            conn.commit()
        self._seed_if_empty()
        self._load_state_from_sqlite()

# Global database singleton
db = SQLiteDatabase()

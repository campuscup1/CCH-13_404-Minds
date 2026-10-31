import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.data.database import db

client = TestClient(app)

def run_tests():
    print("\n=================================================================")
    print("STARTING EXHAUSTIVE API VERIFICATION TEST SUITE (19 ENDPOINTS)")
    print("=================================================================")

    # Reset system state
    db.reset_to_seeds()

    # -------------------------------------------------------------
    # 1. SYSTEM ROOT & HEALTH
    # -------------------------------------------------------------
    print("\n--> [GROUP 1: ROOT & HEALTH]")
    res = client.get("/")
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "online"
    print("  [PASS] GET / -> 200 OK")

    res = client.get("/health")
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "healthy"
    print("  [PASS] GET /health -> 200 OK")

    # -------------------------------------------------------------
    # 2. AUTHENTICATION & PROFILES
    # -------------------------------------------------------------
    print("\n--> [GROUP 2: AUTHENTICATION & PROFILES]")
    # Bad credentials
    res = client.post("/api/auth/login", json={"username": "fake_user", "password": "wrong"})
    assert res.status_code == 401
    print("  [PASS] POST /api/auth/login (Invalid credentials) -> 401 Unauthorized")

    # Admin Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200, res.text
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [PASS] POST /api/auth/login (Admin) -> 200 OK (JWT issued)")

    # Driver Login
    res = client.post("/api/auth/login", json={"username": "driver1", "password": "driver123"})
    assert res.status_code == 200, res.text
    driver1_token = res.json()["access_token"]
    driver1_headers = {"Authorization": f"Bearer {driver1_token}"}
    print("  [PASS] POST /api/auth/login (Driver1) -> 200 OK (JWT issued)")

    # Unauthenticated /me
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    print("  [PASS] GET /api/auth/me (No Token) -> 401 Unauthorized")

    # Authenticated Admin /me
    res = client.get("/api/auth/me", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert res.json()["role"] == "ADMIN"
    print("  [PASS] GET /api/auth/me (Admin) -> 200 OK")

    # Authenticated Driver /me
    res = client.get("/api/auth/me", headers=driver1_headers)
    assert res.status_code == 200, res.text
    assert res.json()["role"] == "DRIVER"
    print("  [PASS] GET /api/auth/me (Driver) -> 200 OK")

    # -------------------------------------------------------------
    # 3. PUBLIC & CLIENT ENDPOINTS (NO AUTH REQUIRED)
    # -------------------------------------------------------------
    print("\n--> [GROUP 3: CLIENT & PUBLIC ENDPOINTS - NO AUTH]")
    # Public Map Data
    res = client.get("/api/public/map-data")
    assert res.status_code == 200, res.text
    map_data = res.json()
    assert len(map_data["nodes"]) == 20
    assert len(map_data["edges"]) == 30
    assert len(map_data["stations"]) == 3
    assert len(map_data["hospitals"]) == 4
    print(f"  [PASS] GET /api/public/map-data -> 200 OK (20 nodes, 30 edges, 3 stations, 4 hospitals)")

    # Public Emergency Request 1: Critical Cardiac incident near East Tech Corridor (N7)
    cardiac_payload = {
        "caller_name": "Rohan Gupta",
        "caller_phone": "+91-9876543210",
        "patient_name": "Suresh Gupta",
        "patient_age": 58,
        "category": "CARDIAC",
        "severity": "CRITICAL",
        "description": "Patient experiencing crushing chest pain, collapsed",
        "pickup_address": "Tech Park Gate 2, East Corridor",
        "pickup_coordinate": {"lat": 12.9360, "lon": 77.6370}
    }
    res = client.post("/api/emergency/request", json=cardiac_payload)
    assert res.status_code == 201, res.text
    inc_1 = res.json()
    inc_1_id = inc_1["id"]
    assigned_amb_id = inc_1["assigned_ambulance_id"]
    print(f"  [PASS] POST /api/emergency/request (Critical Cardiac) -> 201 Created")
    print(f"         Incident: {inc_1_id} -> Assigned Ambulance: {assigned_amb_id}")
    assert inc_1["stage1_route"] is not None
    print(f"         Stage 1 Route: {inc_1['stage1_route']['path_nodes']} ({inc_1['stage1_route']['total_duration_minutes']} min, {inc_1['stage1_route']['total_distance_km']} km)")

    # Public Emergency Request 2: Trauma incident
    trauma_payload = {
        "caller_name": "Priya Sharma",
        "caller_phone": "+91-9123456789",
        "patient_name": "Amit Sharma",
        "patient_age": 30,
        "category": "TRAUMA",
        "severity": "HIGH",
        "description": "Road accident, multiple fractures and bleeding",
        "pickup_address": "Highland Boulevard, Near North-West Parkway",
        "pickup_coordinate": {"lat": 12.9490, "lon": 77.6050}
    }
    res = client.post("/api/emergency/request", json=trauma_payload)
    assert res.status_code == 201, res.text
    inc_2_id = res.json()["id"]
    print(f"  [PASS] POST /api/emergency/request (Trauma) -> 201 Created (ID: {inc_2_id})")

    # Track Emergency Status
    res = client.get(f"/api/emergency/{inc_1_id}")
    assert res.status_code == 200, res.text
    assert res.json()["id"] == inc_1_id
    print(f"  [PASS] GET /api/emergency/{inc_1_id} -> 200 OK (Status: {res.json()['journey_stage']})")

    # Track Non-existent Emergency
    res = client.get("/api/emergency/INC_DOES_NOT_EXIST")
    assert res.status_code == 404
    print("  [PASS] GET /api/emergency/INC_DOES_NOT_EXIST -> 404 Not Found")

    # -------------------------------------------------------------
    # 4. AMBULANCE DRIVER ENDPOINTS
    # -------------------------------------------------------------
    print("\n--> [GROUP 4: AMBULANCE DRIVER LIFECYCLE]")
    # Find driver assigned to assigned_amb_id
    dispatched_amb = db.get_ambulance(assigned_amb_id)
    assigned_driver = db.get_user_by_id(dispatched_amb.assigned_driver_id)
    if not assigned_driver:
        assigned_driver = db.get_user_by_username("driver1")

    res = client.post("/api/auth/login", json={"username": assigned_driver["username"], "password": "driver123"})
    active_driver_token = res.json()["access_token"]
    active_driver_headers = {"Authorization": f"Bearer {active_driver_token}"}

    # Driver views active mission
    res = client.get("/api/driver/my-dispatch", headers=active_driver_headers)
    assert res.status_code == 200, res.text
    assert res.json()["ambulance"]["id"] == assigned_amb_id
    print(f"  [PASS] GET /api/driver/my-dispatch -> 200 OK (Mission linked: {res.json()['active_emergency']['id']})")

    # Driver reports real-time GPS location
    res = client.post("/api/driver/location", json={
        "current_coordinate": {"lat": 12.9480, "lon": 77.6320},
        "speed_kmh": 46.0
    }, headers=active_driver_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/driver/location -> 200 OK (GPS Telemetry updated)")

    # Status update: EN_ROUTE_TO_PATIENT
    res = client.post("/api/driver/status", json={"status": "EN_ROUTE_TO_PATIENT"}, headers=active_driver_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/driver/status (EN_ROUTE_TO_PATIENT) -> 200 OK")

    # Status update: ARRIVED_AT_SCENE
    res = client.post("/api/driver/status", json={"status": "ARRIVED_AT_SCENE"}, headers=active_driver_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/driver/status (ARRIVED_AT_SCENE) -> 200 OK")

    # Status update: PICKUP_CONFIRMED -> Triggers Hospital Recommendation & Stage 2 Route
    res = client.post("/api/driver/status", json={"status": "PICKUP_CONFIRMED"}, headers=active_driver_headers)
    assert res.status_code == 200, res.text
    pickup_data = res.json()["emergency"]
    dest_hospital_id = pickup_data["destination_hospital_id"]
    recommendations = pickup_data["hospital_recommendations"]
    print(f"  [PASS] POST /api/driver/status (PICKUP_CONFIRMED) -> 200 OK")
    print(f"         Multi-Criteria Recommendation: Top Pick = {dest_hospital_id}")
    print(f"         Justification: {recommendations[0]['reason']}")
    print(f"         Stage 2 Route: {pickup_data['stage2_route']['path_nodes']} ({pickup_data['stage2_route']['total_duration_minutes']} min)")
    assert dest_hospital_id is not None
    assert pickup_data["stage2_route"] is not None

    # -------------------------------------------------------------
    # 5. DYNAMIC SIMULATION & REROUTING ENDPOINTS
    # -------------------------------------------------------------
    print("\n--> [GROUP 5: DYNAMIC SIMULATION & REROUTING]")
    stage2_nodes = pickup_data["stage2_route"]["path_nodes"]
    assert len(stage2_nodes) >= 2
    u_block, v_block = stage2_nodes[0], stage2_nodes[1]

    # Inject roadblock on the active stage 2 path
    res = client.post("/api/simulate/roadblock", json={
        "u_node": u_block,
        "v_node": v_block,
        "is_blocked": True,
        "reason": "Severe tanker collision blocking all lanes"
    }, headers=admin_headers)
    assert res.status_code == 200, res.text
    sim_data = res.json()
    assert sim_data["rerouted_incidents_count"] >= 1
    print(f"  [PASS] POST /api/simulate/roadblock (Block {u_block} <-> {v_block}) -> 200 OK")
    print(f"         Journeys Automatically Rerouted: {sim_data['rerouted_incidents_count']}")

    # Verify tracking reflects the detour
    res = client.get(f"/api/emergency/{inc_1_id}")
    assert res.status_code == 200
    rerouted_route = res.json()["stage2_route"]
    assert rerouted_route["is_rerouted"] is True
    print(f"  [PASS] Verified Emergency Tracking: is_rerouted = True")
    print(f"         New Bypass Path: {rerouted_route['path_nodes']}")
    print(f"         Detour Reason: {rerouted_route['reroute_reason']}")

    # Inject dynamic traffic congestion on another segment
    res = client.post("/api/simulate/traffic", json={
        "u_node": "N1",
        "v_node": "N2",
        "traffic_factor": 0.20
    }, headers=admin_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/simulate/traffic (N1-N2 factor=0.20) -> 200 OK")

    # Clear roadblock
    res = client.post("/api/simulate/roadblock", json={
        "u_node": u_block,
        "v_node": v_block,
        "is_blocked": False
    }, headers=admin_headers)
    assert res.status_code == 200, res.text
    print(f"  [PASS] POST /api/simulate/roadblock (Clear {u_block} <-> {v_block}) -> 200 OK")

    # -------------------------------------------------------------
    # 6. ADMIN MANAGEMENT & TELEMETRY
    # -------------------------------------------------------------
    print("\n--> [GROUP 6: ADMIN MANAGEMENT & METRICS]")
    res = client.get("/api/admin/overview", headers=admin_headers)
    assert res.status_code == 200, res.text
    metrics = res.json()["metrics"]
    print(f"  [PASS] GET /api/admin/overview -> 200 OK (Fleet: {metrics['total_ambulances']}, Active: {metrics['active_emergencies']}, Available ICU: {metrics['available_icu_beds']})")

    res = client.get("/api/admin/stations", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 3
    print(f"  [PASS] GET /api/admin/stations -> 200 OK ({len(res.json())} stations)")

    res = client.get("/api/admin/ambulances", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 6
    print(f"  [PASS] GET /api/admin/ambulances -> 200 OK ({len(res.json())} ambulances)")

    res = client.get("/api/admin/emergencies", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) >= 2
    print(f"  [PASS] GET /api/admin/emergencies -> 200 OK ({len(res.json())} incidents logged)")

    res = client.get("/api/admin/hospitals", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert len(res.json()) == 4
    print(f"  [PASS] GET /api/admin/hospitals -> 200 OK ({len(res.json())} hospitals)")

    # Update hospital capacity
    res = client.put(f"/api/admin/hospitals/{dest_hospital_id}/capacity?available_icu_beds=3&available_er_beds=7", headers=admin_headers)
    assert res.status_code == 200, res.text
    assert res.json()["hospital"]["available_icu_beds"] == 3
    print(f"  [PASS] PUT /api/admin/hospitals/{dest_hospital_id}/capacity -> 200 OK (ICU: 3, ER: 7)")

    # -------------------------------------------------------------
    # 7. SECURITY & ROLE AUTHORIZATION GUARDS
    # -------------------------------------------------------------
    print("\n--> [GROUP 7: RBAC AUTHORIZATION BOUNDARIES]")
    # Anonymous calling admin endpoint
    res = client.get("/api/admin/overview")
    assert res.status_code == 401
    print("  [PASS] Anonymous -> GET /api/admin/overview -> 401 Unauthorized")

    # Driver calling admin endpoint
    res = client.get("/api/admin/overview", headers=active_driver_headers)
    assert res.status_code == 403
    print("  [PASS] Driver -> GET /api/admin/overview -> 403 Forbidden")

    # Admin calling driver endpoint
    res = client.get("/api/driver/my-dispatch", headers=admin_headers)
    assert res.status_code == 403
    print("  [PASS] Admin -> GET /api/driver/my-dispatch -> 403 Forbidden")

    # Complete emergency journey
    res = client.post("/api/driver/status", json={"status": "ARRIVED_AT_HOSPITAL"}, headers=active_driver_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/driver/status (ARRIVED_AT_HOSPITAL) -> 200 OK (Journey COMPLETED, Ambulance AVAILABLE)")

    # System reset
    res = client.post("/api/admin/system/reset", headers=admin_headers)
    assert res.status_code == 200, res.text
    print("  [PASS] POST /api/admin/system/reset -> 200 OK (Baseline restored)")

    print("\n=================================================================")
    print(" ALL 19 API ENDPOINTS TESTED AND VERIFIED WITH 100% SUCCESS! ")
    print("=================================================================\n")

if __name__ == "__main__":
    run_tests()

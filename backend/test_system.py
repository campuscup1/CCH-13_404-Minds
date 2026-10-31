import sys
from fastapi.testclient import TestClient
from app.main import app
from app.data.database import db

client = TestClient(app)

def test_full_pipeline():
    print("\n--- [1] Resetting System to Demo Seeds ---")
    db.reset_to_seeds()
    
    print("\n--- [2] Healthcheck & Root Metadata ---")
    res = client.get("/")
    assert res.status_code == 200, res.text
    print(" Root API Response:", res.json()["system"])

    # 1. Client creates emergency (NO AUTH NEEDED)
    print("\n--- [3] Role 1: Client Submits Emergency Distress Call ---")
    emergency_payload = {
        "caller_name": "Sarah Connor",
        "caller_phone": "+91-9876543210",
        "patient_name": "John Connor",
        "patient_age": 45,
        "category": "CARDIAC",
        "severity": "CRITICAL",
        "description": "Severe chest pain, shortness of breath, sudden collapse",
        "pickup_address": "Tech Park Block 4, Near East Corridor",
        "pickup_coordinate": {"lat": 12.9360, "lon": 77.6370}  # Near Node N7
    }
    res = client.post("/api/emergency/request", json=emergency_payload)
    assert res.status_code == 201, res.text
    incident = res.json()
    incident_id = incident["id"]
    assigned_amb = incident["assigned_ambulance_id"]
    print(f" Incident Created: {incident_id}")
    print(f" Assigned Ambulance: {assigned_amb} (Stage: {incident['journey_stage']})")
    assert incident["stage1_route"] is not None
    print(f" Stage 1 Route: {incident['stage1_route']['path_nodes']}, Distance: {incident['stage1_route']['total_distance_km']} km, ETA: {incident['stage1_route']['total_duration_minutes']} min")

    # 2. Public tracking endpoint
    print("\n--- [4] Public Map & Emergency Tracking (No Auth) ---")
    res = client.get(f"/api/emergency/{incident_id}")
    assert res.status_code == 200
    print(f" Public tracking verified: Status = {res.json()['journey_stage']}")

    # 3. Role 2: Driver Authentication & Mission Workflow
    print("\n--- [5] Role 2: Ambulance Driver Login & Mission Execution ---")
    # Find which driver is assigned to the dispatched ambulance
    dispatched_amb = db.get_ambulance(assigned_amb)
    driver_user = db.get_user_by_id(dispatched_amb.assigned_driver_id) if dispatched_amb and dispatched_amb.assigned_driver_id else None
    driver_username = driver_user["username"] if driver_user else "driver1"
    print(f" Logging in as assigned driver: {driver_username} (for {assigned_amb})")

    res = client.post("/api/auth/login", json={"username": driver_username, "password": "driver123"})
    assert res.status_code == 200, res.text
    driver_token = res.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    print(" Driver Authenticated successfully.")

    # Driver checks assigned mission
    res = client.get("/api/driver/my-dispatch", headers=driver_headers)
    assert res.status_code == 200, res.text
    dispatch_data = res.json()
    print(f" Driver's Active Mission: {dispatch_data['active_emergency']['id'] if dispatch_data['active_emergency'] else 'None'}")

    # Driver reports en-route
    res = client.post("/api/driver/status", json={"status": "EN_ROUTE_TO_PATIENT"}, headers=driver_headers)
    assert res.status_code == 200
    print(" Status -> EN_ROUTE_TO_PATIENT")

    # Driver arrives at scene
    res = client.post("/api/driver/status", json={"status": "ARRIVED_AT_SCENE"}, headers=driver_headers)
    assert res.status_code == 200
    print(" Status -> ARRIVED_AT_SCENE")

    # Driver confirms pickup -> Triggers Hospital Recommendation & Stage 2 Route
    print("\n--- [6] Patient Pickup Confirmed -> Multi-Criteria Hospital Recommendation ---")
    res = client.post("/api/driver/status", json={"status": "PICKUP_CONFIRMED"}, headers=driver_headers)
    assert res.status_code == 200
    updated_data = res.json()
    updated_incident = updated_data["emergency"]
    dest_hospital_id = updated_incident["destination_hospital_id"]
    recommendations = updated_incident["hospital_recommendations"]
    print(f" Destination Hospital Recommended: {dest_hospital_id}")
    print(f" Top Recommendation Reason: {recommendations[0]['reason']}")
    print(f" Stage 2 Route to Hospital: {updated_incident['stage2_route']['path_nodes']}, Distance: {updated_incident['stage2_route']['total_distance_km']} km, ETA: {updated_incident['stage2_route']['total_duration_minutes']} min")
    assert dest_hospital_id is not None
    assert updated_incident["stage2_route"] is not None

    # 4. Simulation: Inject Roadblock on Stage 2 Route
    print("\n--- [7] Dynamic Simulation: Roadblock Trigger & Automatic Rerouting ---")
    stage2_nodes = updated_incident["stage2_route"]["path_nodes"]
    print(f" Active Stage 2 path nodes: {stage2_nodes}")
    if len(stage2_nodes) >= 2:
        u_block, v_block = stage2_nodes[0], stage2_nodes[1]
        print(f" Simulating Roadblock between {u_block} and {v_block}...")
        
        # Authenticate admin for roadblock
        res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        admin_token = res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res = client.post("/api/simulate/roadblock", json={
            "u_node": u_block,
            "v_node": v_block,
            "is_blocked": True,
            "reason": "Overturned oil tanker blocking all lanes"
        }, headers=admin_headers)
        assert res.status_code == 200
        sim_data = res.json()
        print(f" Rerouted incidents count: {sim_data['rerouted_incidents_count']}")
        
        # Check that incident now has a rerouted path
        refreshed_inc = client.get(f"/api/emergency/{incident_id}").json()
        print(f" New Stage 2 Path: {refreshed_inc['stage2_route']['path_nodes']}")
        print(f" Is Rerouted: {refreshed_inc['stage2_route']['is_rerouted']}")
        print(f" Detour Reason: {refreshed_inc['stage2_route']['reroute_reason']}")
        assert refreshed_inc['stage2_route']['is_rerouted'] is True

    # 5. Role 3: Ambulance Station Admin Operations
    print("\n--- [8] Role 3: Ambulance Station Admin Operations ---")
    res = client.get("/api/admin/overview", headers=admin_headers)
    assert res.status_code == 200
    print(" Admin Dashboard Overview:", res.json()["metrics"])

    # Update hospital capacity
    res = client.put(f"/api/admin/hospitals/{dest_hospital_id}/capacity?available_icu_beds=1&available_er_beds=2", headers=admin_headers)
    assert res.status_code == 200
    print(f" Updated Hospital Capacity: {res.json()['message']}")

    # 6. Authorization checks
    print("\n--- [9] Security & Authorization Boundary Checks ---")
    # Client / Anonymous accessing admin endpoint -> 401
    res = client.get("/api/admin/overview")
    assert res.status_code == 401
    print(" Unauthorized request blocked with 401.")

    # Driver accessing admin endpoint -> 403 Forbidden
    res = client.get("/api/admin/overview", headers=driver_headers)
    assert res.status_code == 403
    print(" Driver trying admin route blocked with 403 Forbidden.")

    # Driver completes journey
    res = client.post("/api/driver/status", json={"status": "ARRIVED_AT_HOSPITAL"}, headers=driver_headers)
    assert res.status_code == 200
    final_inc = client.get(f"/api/emergency/{incident_id}").json()
    print(f" Final Journey Completed Stage: {final_inc['journey_stage']}")

    print("\n ALL BACKEND SYSTEM TESTS PASSED SUCCESSFULLY! ")

if __name__ == "__main__":
    test_full_pipeline()

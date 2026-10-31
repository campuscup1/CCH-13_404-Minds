from typing import Dict, List, Any
from app.models.schemas import (
    AmbulanceStation, Ambulance, Hospital, Coordinate, 
    AmbulanceType, AmbulanceStatus, EmergencyCategory, RoleEnum
)
from app.core.security import hash_password

# Road network nodes (Intersections with coordinates in a metropolitan zone)
SEED_NODES: Dict[str, Dict[str, Any]] = {
    "N1": {"id": "N1", "name": "Station Central Junction", "lat": 12.9352, "lon": 77.6145},
    "N2": {"id": "N2", "name": "Commercial St & 1st Cross", "lat": 12.9390, "lon": 77.6148},
    "N3": {"id": "N3", "name": "North Ring Intersection", "lat": 12.9460, "lon": 77.6155},
    "N4": {"id": "N4", "name": "Station North Point", "lat": 12.9520, "lon": 77.6250},
    "N5": {"id": "N5", "name": "Metro Expressway East", "lat": 12.9480, "lon": 77.6320},
    "N6": {"id": "N6", "name": "Apex Heart Hospital Gate", "lat": 12.9430, "lon": 77.6360},
    "N7": {"id": "N7", "name": "East Tech Corridor", "lat": 12.9350, "lon": 77.6380},
    "N8": {"id": "N8", "name": "City Memorial Hospital Square", "lat": 12.9280, "lon": 77.6350},
    "N9": {"id": "N9", "name": "Market Circle East", "lat": 12.9240, "lon": 77.6250},
    "N10": {"id": "N10", "name": "Station South Avenue", "lat": 12.9180, "lon": 77.6050},
    "N11": {"id": "N11", "name": "Civic Center West", "lat": 12.9250, "lon": 77.6010},
    "N12": {"id": "N12", "name": "Rainbow Children Hospital Plaza", "lat": 12.9320, "lon": 77.6000},
    "N13": {"id": "N13", "name": "Suburban Green Hospital Gate", "lat": 12.9420, "lon": 77.5980},
    "N14": {"id": "N14", "name": "West Ring Boulevard", "lat": 12.9490, "lon": 77.6050},
    "N15": {"id": "N15", "name": "Central Park Interchange", "lat": 12.9350, "lon": 77.6250},
    "N16": {"id": "N16", "name": "Grand Boulevard North", "lat": 12.9410, "lon": 77.6240},
    "N17": {"id": "N17", "name": "Midtown Avenue Crossing", "lat": 12.9300, "lon": 77.6180},
    "N18": {"id": "N18", "name": "University Gate East", "lat": 12.9380, "lon": 77.6070},
    "N19": {"id": "N19", "name": "Old Town Circle", "lat": 12.9280, "lon": 77.6100},
    "N20": {"id": "N20", "name": "Riverside Link Road", "lat": 12.9160, "lon": 77.6200},
}

# Road edges connecting nodes (bidirectional representation)
# speed in km/h, distance in meters
SEED_EDGES: List[Dict[str, Any]] = [
    # Central loop
    {"u": "N1", "v": "N2", "road_name": "Central Main St", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N2", "v": "N3", "road_name": "Commercial North Way", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N3", "v": "N4", "road_name": "North Ring Expressway", "speed_kmh": 60, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N4", "v": "N5", "road_name": "North-East Arterial", "speed_kmh": 55, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N5", "v": "N6", "road_name": "Heart Care Bypass", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N6", "v": "N7", "road_name": "Eastern Tech Link", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N7", "v": "N8", "road_name": "Trauma Emergency Road", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N8", "v": "N9", "road_name": "Memorial South Corridor", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N9", "v": "N20", "road_name": "Riverside Link East", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N20", "v": "N10", "road_name": "South Outer Belt", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N10", "v": "N11", "road_name": "Civic Link Avenue", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N11", "v": "N12", "road_name": "Pediatric Hospital Way", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N12", "v": "N13", "road_name": "Green Valley Access Rd", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N13", "v": "N14", "road_name": "North-West Parkway", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N14", "v": "N3", "road_name": "Highland Connector", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    
    # Internal cross arterial streets (grid connectors)
    {"u": "N1", "v": "N17", "road_name": "Midtown Cross Street", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N17", "v": "N15", "road_name": "Park East Boulevard", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N15", "v": "N16", "road_name": "Central Avenue North", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N16", "v": "N2", "road_name": "Market Connect Link", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N16", "v": "N5", "road_name": "Subway Link Road", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N15", "v": "N7", "road_name": "Tech Cross Arterial", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N17", "v": "N9", "road_name": "South Market Highway", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N1", "v": "N19", "road_name": "Heritage Corridor", "speed_kmh": 35, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N19", "v": "N10", "road_name": "South Depot Direct", "speed_kmh": 45, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N19", "v": "N11", "road_name": "West Gate Crescent", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N1", "v": "N18", "road_name": "University Way", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N18", "v": "N12", "road_name": "Child Clinic Bypass", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N18", "v": "N13", "road_name": "Green Valley Cross", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N2", "v": "N18", "road_name": "Commerce-Univ Cut", "speed_kmh": 40, "traffic_factor": 1.0, "is_blocked": False},
    {"u": "N15", "v": "N8", "road_name": "Parkway to Trauma Center", "speed_kmh": 50, "traffic_factor": 1.0, "is_blocked": False},
]

# Stations
SEED_STATIONS: List[Dict[str, Any]] = [
    {
        "id": "STN_CENTRAL",
        "name": "Central Emergency Station 01",
        "address": "12 Central Square, Downtown",
        "coordinate": {"lat": 12.9352, "lon": 77.6145},
        "node_id": "N1",
        "total_ambulances": 2,
        "available_ambulances": 2
    },
    {
        "id": "STN_NORTH",
        "name": "North Metro Station 02",
        "address": "404 North Ring Expressway",
        "coordinate": {"lat": 12.9520, "lon": 77.6250},
        "node_id": "N4",
        "total_ambulances": 2,
        "available_ambulances": 2
    },
    {
        "id": "STN_SOUTH",
        "name": "South Valley Station 03",
        "address": "88 South Avenue Hub",
        "coordinate": {"lat": 12.9180, "lon": 77.6050},
        "node_id": "N10",
        "total_ambulances": 2,
        "available_ambulances": 2
    }
]

# Ambulances
SEED_AMBULANCES: List[Dict[str, Any]] = [
    {
        "id": "AMB_ALS_01",
        "vehicle_number": "EMERG-01",
        "vehicle_type": AmbulanceType.ALS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_CENTRAL",
        "assigned_driver_id": "USR_DRIVER_01",
        "current_location": {"lat": 12.9352, "lon": 77.6145},
        "current_node_id": "N1",
        "equipment": ["Ventilator", "Defibrillator", "Oxygen", "Advanced Paramedic Kit", "Telemetry"]
    },
    {
        "id": "AMB_BLS_01",
        "vehicle_number": "EMERG-02",
        "vehicle_type": AmbulanceType.BLS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_CENTRAL",
        "assigned_driver_id": "USR_DRIVER_02",
        "current_location": {"lat": 12.9352, "lon": 77.6145},
        "current_node_id": "N1",
        "equipment": ["Basic Oxygen", "Spine Board", "First Aid Kit", "Automated External Defibrillator (AED)"]
    },
    {
        "id": "AMB_ALS_02",
        "vehicle_number": "EMERG-03",
        "vehicle_type": AmbulanceType.ALS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_NORTH",
        "assigned_driver_id": "USR_DRIVER_03",
        "current_location": {"lat": 12.9520, "lon": 77.6250},
        "current_node_id": "N4",
        "equipment": ["Ventilator", "ECG Monitor", "Defibrillator", "Critical Care Meds"]
    },
    {
        "id": "AMB_BLS_02",
        "vehicle_number": "EMERG-04",
        "vehicle_type": AmbulanceType.BLS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_NORTH",
        "assigned_driver_id": None,
        "current_location": {"lat": 12.9520, "lon": 77.6250},
        "current_node_id": "N4",
        "equipment": ["Oxygen Tank", "Suction Unit", "First Aid", "Stretcher"]
    },
    {
        "id": "AMB_ALS_03",
        "vehicle_number": "EMERG-05",
        "vehicle_type": AmbulanceType.ALS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_SOUTH",
        "assigned_driver_id": None,
        "current_location": {"lat": 12.9180, "lon": 77.6050},
        "current_node_id": "N10",
        "equipment": ["Advanced Life Support Unit", "Cardiac Monitor", "Ventilator"]
    },
    {
        "id": "AMB_BLS_03",
        "vehicle_number": "EMERG-06",
        "vehicle_type": AmbulanceType.BLS,
        "status": AmbulanceStatus.AVAILABLE,
        "station_id": "STN_SOUTH",
        "assigned_driver_id": None,
        "current_location": {"lat": 12.9180, "lon": 77.6050},
        "current_node_id": "N10",
        "equipment": ["Oxygen", "Trauma Bandages", "C-Spine Collars"]
    }
]

# Hospitals
SEED_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "HOSP_MEMORIAL_TRAUMA",
        "name": "City Memorial Level-1 Trauma Hospital",
        "address": "500 Trauma Emergency Blvd",
        "coordinate": {"lat": 12.9280, "lon": 77.6350},
        "node_id": "N8",
        "specialties": [
            EmergencyCategory.TRAUMA,
            EmergencyCategory.CARDIAC,
            EmergencyCategory.RESPIRATORY,
            EmergencyCategory.GENERAL
        ],
        "total_icu_beds": 30,
        "available_icu_beds": 8,
        "total_er_beds": 45,
        "available_er_beds": 14,
        "burn_unit_available": True,
        "trauma_level": 1,
        "contact_phone": "+91-80-2222-1001"
    },
    {
        "id": "HOSP_APEX_CARDIAC",
        "name": "Apex Heart & Stroke Super-Specialty Institute",
        "address": "100 Cardiac Lane, East Corridor",
        "coordinate": {"lat": 12.9430, "lon": 77.6360},
        "node_id": "N6",
        "specialties": [
            EmergencyCategory.CARDIAC,
            EmergencyCategory.NEUROLOGICAL,
            EmergencyCategory.GENERAL
        ],
        "total_icu_beds": 20,
        "available_icu_beds": 5,
        "total_er_beds": 25,
        "available_er_beds": 10,
        "burn_unit_available": False,
        "trauma_level": 2,
        "contact_phone": "+91-80-2222-1002"
    },
    {
        "id": "HOSP_RAINBOW_CHILDREN",
        "name": "Rainbow Children & Mother Emergency Care",
        "address": "45 Child Health Way, West Wing",
        "coordinate": {"lat": 12.9320, "lon": 77.6000},
        "node_id": "N12",
        "specialties": [
            EmergencyCategory.PEDIATRIC,
            EmergencyCategory.RESPIRATORY,
            EmergencyCategory.GENERAL
        ],
        "total_icu_beds": 16,
        "available_icu_beds": 6,
        "total_er_beds": 20,
        "available_er_beds": 9,
        "burn_unit_available": False,
        "trauma_level": 2,
        "contact_phone": "+91-80-2222-1003"
    },
    {
        "id": "HOSP_GREEN_VALLEY",
        "name": "Green Valley Community Hospital",
        "address": "12 Suburban Avenue West",
        "coordinate": {"lat": 12.9420, "lon": 77.5980},
        "node_id": "N13",
        "specialties": [
            EmergencyCategory.GENERAL,
            EmergencyCategory.RESPIRATORY
        ],
        "total_icu_beds": 10,
        "available_icu_beds": 2,
        "total_er_beds": 18,
        "available_er_beds": 4,
        "burn_unit_available": False,
        "trauma_level": 3,
        "contact_phone": "+91-80-2222-1004"
    }
]

# Seed Users (Admins and Drivers)
SEED_USERS: List[Dict[str, Any]] = [
    {
        "id": "USR_ADMIN_01",
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "name": "Dispatcher Chief Admin",
        "role": RoleEnum.ADMIN,
        "station_id": "STN_CENTRAL",
        "ambulance_id": None
    },
    {
        "id": "USR_DRIVER_01",
        "username": "driver1",
        "password_hash": hash_password("driver123"),
        "name": "Rajesh Kumar (ALS Pilot)",
        "role": RoleEnum.DRIVER,
        "station_id": "STN_CENTRAL",
        "ambulance_id": "AMB_ALS_01"
    },
    {
        "id": "USR_DRIVER_02",
        "username": "driver2",
        "password_hash": hash_password("driver123"),
        "name": "Vikram Singh (BLS Pilot)",
        "role": RoleEnum.DRIVER,
        "station_id": "STN_CENTRAL",
        "ambulance_id": "AMB_BLS_01"
    },
    {
        "id": "USR_DRIVER_03",
        "username": "driver3",
        "password_hash": hash_password("driver123"),
        "name": "Anil Sharma (ALS North)",
        "role": RoleEnum.DRIVER,
        "station_id": "STN_NORTH",
        "ambulance_id": "AMB_ALS_02"
    }
]

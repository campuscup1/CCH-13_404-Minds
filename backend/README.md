# Smart Emergency Ambulance Dispatch & Routing Backend

Backend API for the Emergency Ambulance Dispatch, Dynamic Route Prediction, and Hospital Recommendation System.

---

## 1. System Overview & The 3 Roles

| Role | Auth Required? | Capabilities & Endpoints |
| :--- | :--- | :--- |
| **1. Client (Patient / Helper)** | **No** (Public) | • `POST /api/emergency/request`: Submit distress call (location, emergency category, severity)<br>• `GET /api/emergency/{id}`: Real-time tracking of journey status, assigned ambulance, and hospital recommendation<br>• `GET /api/public/map-data`: Graph nodes, edges, stations, hospitals, and fleet coordinates |
| **2. Ambulance Driver** | **Yes** (JWT Bearer) | • `POST /api/auth/login`: Authenticate with credentials<br>• `GET /api/driver/my-dispatch`: View active incident & route<br>• `POST /api/driver/status`: Update status (`DISPATCHED` $\rightarrow$ `EN_ROUTE_TO_PATIENT` $\rightarrow$ `ARRIVED_AT_SCENE` $\rightarrow$ `PICKUP_CONFIRMED` $\rightarrow$ `ARRIVED_AT_HOSPITAL`)<br>• `POST /api/driver/location`: Report real-time GPS telemetry |
| **3. Ambulance Station Admin** | **Yes** (JWT Bearer) | • `GET /api/admin/overview`: Fleet, emergency, and bed capacity metrics<br>• `GET /api/admin/stations`: List dispatch stations<br>• `GET /api/admin/ambulances`: Fleet list with ALS/BLS equipment<br>• `GET /api/admin/emergencies`: All emergency logs<br>• `PUT /api/admin/hospitals/{id}/capacity`: Adjust ICU/ER bed capacity<br>• `POST /api/simulate/roadblock`: Inject roadblock & trigger dynamic reroute<br>• `POST /api/simulate/traffic`: Inject traffic congestion |

---

## 2. Advanced Routing Algorithm: Bidirectional A* with Dynamic Edge Cost (Bidirectional A*-DEC)

### Why it is superior to Dijkstra and Standard A*:
1. **Dijkstra** explores radially in all directions ($O(V \log V + E)$), scanning a space proportional to $\pi R^2$.
2. **Unidirectional A*** improves this with a heuristic but still searches in a single forward cone.
3. **Bidirectional A*** initiates two concurrent graph searches:
   - **Forward Search** expanding outward from source node $S$.
   - **Backward Search** expanding inward from destination node $T$.
   - Search terminates when both frontiers meet.
   - **Search space is reduced by 50% to 75%** ($\approx 2 \times \pi (R/2)^2 = \frac{1}{2}\pi R^2$), achieving sub-millisecond route calculations even under high request loads.
4. **Dynamic Edge Cost Formula**:
   $$\text{Edge Travel Time} = \frac{\text{Distance}}{\text{Base Speed} \times \text{Traffic Factor}}$$
   - $\text{Traffic Factor} \in [0.05, 1.0]$: $1.0$ is free-flow, $0.25$ is severe congestion.
   - $\text{is\_blocked} = \text{True} \implies \text{Cost} = \infty$ (pruned from path).
5. **Real-time Roadblock & Congestion Rerouting**:
   When an admin or road sensor flags an obstruction on an active ambulance route, the routing engine detects the conflict, computes an optimal detour from the current waypoint to destination, and updates the ETA with an alert.

---

## 3. Multi-Criteria Hospital Recommendation Engine (MCDA)

When patient pickup is confirmed (`PICKUP_CONFIRMED`), the system scores every candidate hospital using a weighted multi-attribute decision model:

$$\text{Composite Score} = (w_{\text{spec}} \times S_{\text{spec}}) + (w_{\text{cap}} \times S_{\text{cap}}) - (w_{\text{time}} \times \text{Transit ETA (min)})$$

- **Specialty Alignment ($S_{\text{spec}}$)**: Matches emergency category (`CARDIAC`, `TRAUMA`, `PEDIATRIC`, `RESPIRATORY`, `NEUROLOGICAL`). E.g., Cardiac arrest matches an emergency cath-lab facility (Score = 95-100), whereas general hospitals score lower (45).
- **Bed Capacity ($S_{\text{cap}}$)**: Evaluates live available ICU and ER beds:
  $$S_{\text{cap}} = \left(\frac{\text{Available ICU}}{\text{Total ICU}} \times 70\right) + \left(\frac{\text{Available ER}}{\text{Total ER}} \times 30\right)$$
  *(Severe penalty if ICU beds are 0 for critical emergencies)*.
- **Transit Time**: Dynamic travel time computed by Bidirectional A* from patient's exact location to hospital gate.

---

## 4. Demo Credentials & Test Data

### Pre-seeded Users:
- **Station Admin**: `username: admin`, `password: admin123`
- **Driver 1 (ALS Central)**: `username: driver1`, `password: driver123`
- **Driver 2 (BLS Central)**: `username: driver2`, `password: driver123`
- **Driver 3 (ALS North)**: `username: driver3`, `password: driver123`

### Pre-seeded Entities:
- **3 Stations**: Central Emergency Station, North Metro Station, South Valley Station.
- **6 Ambulances**: 3 Advanced Life Support (ALS with ventilators/defibrillators), 3 Basic Life Support (BLS).
- **4 Hospitals**:
  1. `HOSP_MEMORIAL_TRAUMA` (City Memorial Level-1 Trauma Hospital)
  2. `HOSP_APEX_CARDIAC` (Apex Heart & Stroke Super-Specialty Institute)
  3. `HOSP_RAINBOW_CHILDREN` (Rainbow Children & Mother Emergency Care)
  4. `HOSP_GREEN_VALLEY` (Green Valley Community Hospital)
- **Road Network**: 20 interconnected intersections with realistic GPS coordinates, speed limits, and bidirectional street segments.

---

## 5. How to Run

### Install Dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Run Server:
```bash
uvicorn app.main:app --reload --port 8000
```
Open **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Run Automated Pipeline Test:
```bash
python test_system.py
```

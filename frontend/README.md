# MediRoute AI 🚑
### Smart Emergency Ambulance Dispatch, Dynamic Route Prediction and Hospital Recommendation System

> **National-Level College Hackathon Prototype**  
> Developed for rapid emergency response, intelligent multi-criteria ambulance dispatching, graph-based shortest path routing (Dijkstra & A*), dynamic roadblock detour recalculation, and capacity-aware hospital intake matching.

---

## 1. Project Introduction

In urban emergency medical scenarios, the **golden hour**—the first 60 minutes after trauma or acute medical onset—determines patient survival. Traditional dispatch systems rely on static territorial assignments, voice call negotiations, and generic navigation apps that do not account for critical hospital bed capacities, specialized trauma certifications, or dynamic road closures.

**MediRoute AI** is an intelligent, reactive full-stack emergency medical services (EMS) decision-support system. Designed around the realistic urban road network of **Solapur City, Maharashtra (~17.6599° N, 75.9064° E)**, MediRoute AI models roads as a weighted graph, tracking fleet telemetry, hospital bed occupancy, and incoming incident priority in real time.

---

## 2. Technology Stack

- **Frontend Core:** React.js 18.3, Vite 6.0
- **Routing:** React Router DOM v6
- **Styling & Design System:** Tailwind CSS v3.4 (Healthcare Theme: Navy `#102A43`, Medical Blue `#2563EB`, Light Grey `#F5F7FB`, White `#FFFFFF`)
- **Interactive Mapping:** Leaflet.js 1.9 & React-Leaflet 4.2 with OpenStreetMap raster tiles
- **Data Visualization & Charts:** Recharts 2.15 (Pie, Stacked Bar, and Line charts)
- **Icons:** Lucide React
- **HTTP Client & Integration Layer:** Axios 1.7 (Service layer pre-configured for future Java Spring Boot REST integration)
- **State Management & Persistence:** React Context API + LocalStorage persistence

---

## 3. Implemented Algorithms

MediRoute AI implements transparent, explainable algorithms in pure JavaScript:

### A. Dijkstra's Shortest Path Algorithm (`src/algorithms/dijkstra.js`)
Calculates the mathematically optimal path across the Solapur road network graph:
- **Graph Representation:** 17 landmark intersection nodes and 25 realistic road edges with curve polylines.
- **Edge Weights:** Base travel time in minutes adjusted for distance ($km$) and speed limits.
- **Dynamic Adaptability:** Respects blocked edges and traffic congestion multipliers.

### B. A* Search Algorithm (`src/algorithms/astar.js`)
An admissible heuristic search alternative using:
$$f(n) = g(n) + h(n)$$
Where $h(n) = \frac{\text{Haversine Distance}(n, \text{Goal})}{\text{Max Assumed Speed}}$. Guaranteed to find the optimal path while exploring fewer search nodes.

### C. Smart Ambulance Assignment (`src/algorithms/ambulanceAssignment.js`)
Multi-criteria ranking engine for incoming incidents:
1. **Fleet Availability Filtering:** Excludes busy, en-route, or out-of-service vehicles.
2. **Clinical Equipment Matching:** Verifies required life-support apparatus (Oxygen, Ventilator, Defibrillator, Stretcher, Trauma Kit).
3. **Shortest Travel-Time Route:** Executes Dijkstra from each eligible ambulance's current node to the patient.
4. **Composite Ranking Score:**
   $$\text{Score} = 50\% \times \text{ETA Score} + 35\% \times \text{Equipment Match \%} + 15\% \times \text{Vehicle Telemetry}$$

### D. Facility-Matched Hospital Recommendation (`src/algorithms/hospitalRecommendation.js`)
Two-stage intelligent recommendation engine:
- **Stage 1 (Hard Eligibility Filter):** Disqualifies hospitals lacking the required critical department (e.g., Cardiac, Trauma) or reporting zero available Emergency/ICU beds.
- **Stage 2 (Weighted Transparent Ranking):**
  $$\text{Hospital Score} = 40\% \times \text{Facility Match} + 30\% \times \text{Bed Capacity} + 30\% \times \text{Travel-Time Proximity}$$

### E. Rule-Based Emergency Priority Triage (`src/algorithms/emergencyPriority.js`)
Deterministic priority classification categorizing calls into **Critical**, **High**, **Medium**, or **Normal** based on emergency keywords (e.g., cardiac arrest, unconscious, crush injury), category risk, and demographic vulnerability factors.

### F. Dynamic Route Recalculation Engine (`src/algorithms/routeRecalculation.js`)
When an arterial corridor is blocked or experiences heavy traffic:
- Removes the blocked edge from the adjacency list.
- Re-executes Dijkstra or A* to calculate a verified detour on the road graph.
- Generates side-by-side comparative metrics (Original Distance vs Detour Distance, Added Delay).

---

## 4. All 17 Available Pages

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | **Landing Page** | `/` | Hero section, 7 objectives showcase, technology highlights, live Solapur grid stats, disclaimer. |
| 2 | **Login** | `/login` | Admin & Dispatcher credentials, 1-click demo fill buttons, form validation. |
| 3 | **Register** | `/register` | EMS personnel registration form with role selection. |
| 4 | **Admin Dashboard** | `/dashboard` | Real-time statistics, active request queue, interactive Solapur Leaflet map, Recharts graphs. |
| 5 | **Emergency Requests** | `/emergencies` | Interactive emergency submission form with map click-to-pin and browser GPS locator. |
| 6 | **Priority Assessment** | `/assessment` | Transparent triage breakdown with rule-matching audit and dispatcher override controls. |
| 7 | **Ambulance Stations** | `/stations` | Regional Solapur ambulance depot management with coverage map. |
| 8 | **Ambulance Fleet** | `/ambulances` | Fleet of 10+ vehicles, equipment inventory, driver details, and status updates. |
| 9 | **Smart Dispatch** | `/dispatch` | Multi-criteria fleet evaluation with transparent ranking cards and 1-click dispatch. |
| 10 | **Ambulance Route** | `/route-prediction` | Stage 1 journey: Depot to patient pickup with real road polyline. |
| 11 | **Hospital Management** | `/hospitals` | Hospital network directory with live +/- bed capacity adjusters. |
| 12 | **Hospital Recommender** | `/hospital-recommendation` | Capacity-aware matching recommending top 3 receiving facilities. |
| 13 | **Hospital Route** | `/hospital-route` | Stage 2 journey: Patient pickup to hospital trauma bay with intake pre-alert. |
| 14 | **Dynamic Rerouting** | `/dynamic-routing` | Interactive roadblock and traffic congestion simulator with real-time detour recalculation. |
| 15 | **Live Journey Tracker** | `/journey-tracking` | Controlled 9-stage simulation playback with Play, Pause, Step Forward, and speed controls. |
| 16 | **Analytics & Reports** | `/analytics` | Historical trends, response time benchmarks, daily call breakdown, and CSV export. |
| 17 | **Notifications Center** | `/notifications` | Live operational alert feed with read/unread filters. |
| 18 | **Settings & Profile** | `/settings` | Dispatcher account settings, algorithm weight sliders, and factory reset button. |

---

## 5. End-to-End Demonstration Workflow for Judges

1. **Open Landing Page:** Visit `http://localhost:5173/` and explore the problem statement overview and live statistics.
2. **One-Click Demo Login:** Click "Admin Login" and use the "1-Click Admin" demo button.
3. **Open Dashboard:** Observe Solapur City live map, hospital bed occupancy, and active call queue.
4. **Log New Emergency:** Click "New Emergency". Choose "Cardiac Emergency" at Saat Rasta Chowk, check "Oxygen" and "Defibrillator", and submit.
5. **Inspect Priority Triage:** Review the rule-based classification assigning `CRITICAL` priority due to cardiac symptoms.
6. **Smart Ambulance Dispatch:** Proceed to Smart Dispatch. Observe the algorithm evaluating all 10 ambulances and selecting `AMB-103 (ALS)` based on lowest ETA and 100% equipment match.
7. **Stage 1 Route Prediction:** Confirm dispatch. View the ingress road route polyline from depot to patient on Leaflet map.
8. **Confirm Patient Pickup:** Click "Confirm Patient Pickup" to complete the first leg.
9. **Hospital Recommendation:** Review the top 3 hospital recommendations scored via 40% Facility + 30% Capacity + 30% Travel Time. Confirm `Civil Hospital`.
10. **Stage 2 Transport Route:** View the second leg routing to the hospital trauma bay.
11. **Simulate Dynamic Roadblock:** Navigate to "Dynamic Rerouting". Block `Dr. Ambedkar Road`. Watch Dijkstra recalculate an alternative detour (+1.2 km, +2.5 mins delay) and display the vibrant green path.
12. **Live Playback Journey:** Navigate to "Live Journey Tracker" and click "Play Simulation" to watch the 9-stage progression.
13. **Complete Journey:** Click "Admit Patient" to conclude the mission and view updated analytics.

---

## 6. Installation & How to Run

### Prerequisites
- Node.js (v18+ recommended; verified on Node v24)
- npm (v9+)

### Commands

```bash
# Navigate to project directory
cd d:/mediroute-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at:
`http://localhost:5173/`

To build for production:
```bash
npm run build
```

---

## 7. Future Backend Architecture (Java Spring Boot + MySQL)

The frontend contains a clean service abstraction layer (`src/services/api.js`). To connect to a Spring Boot backend in the future:
1. Configure `VITE_API_BASE_URL=http://localhost:8080/api/v1` in an `.env` file.
2. Toggle `USE_REMOTE_BACKEND = true` in `src/services/api.js`.
3. The existing Axios client will immediately communicate with the corresponding Spring Boot controller endpoints (`@RestController` for `/emergencies`, `/ambulances`, `/hospitals`).

---

## 8. Academic Prototype Limitations

- **Simulated Road Graph:** Uses a representative graph of 17 Solapur landmark nodes and 25 edges for deterministic algorithmic verification.
- **Simulated GPS:** Playback demonstrates vehicle motion along road coordinates; it does not connect to physical onboard OBD-II GPS transponders.
- **Fictional Medical Data:** Hospital names, bed availability numbers, and phone records are generated for college hackathon evaluation purposes.

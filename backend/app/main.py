import sys
import os

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, client, driver, admin, simulation

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## Smart Emergency Ambulance Dispatch, Dynamic Route Prediction & Hospital Recommendation System
    
    ### 3 Distinct User Roles:
    1. **Client (Patient / Helper)**:
       - No login required.
       - Submit emergency calls with GPS location, emergency category, and severity.
       - Track live 2-stage journey, assigned ambulance, and recommended hospital.
       
    2. **Ambulance Driver**:
       - Login required (`POST /api/auth/login`).
       - View active mission and turn-by-turn route.
       - Progress journey stages (`EN_ROUTE_TO_PATIENT`, `ARRIVED_AT_SCENE`, `PICKUP_CONFIRMED`, `ARRIVED_AT_HOSPITAL`).
       - Confirming pickup triggers Multi-Criteria Hospital Recommendation and Stage 2 route.
       
    3. **Ambulance Station Admin**:
       - Login required (`POST /api/auth/login`).
       - Oversee fleet, stations, hospital bed capacities.
       - Simulate live roadblocks and traffic congestion; triggers immediate Bidirectional A* dynamic route recalculation.
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(client.router, prefix=settings.API_PREFIX)
app.include_router(driver.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "endpoints": {
            "auth": f"{settings.API_PREFIX}/auth/login",
            "client_emergency_request": f"{settings.API_PREFIX}/emergency/request",
            "driver_mission": f"{settings.API_PREFIX}/driver/my-dispatch",
            "admin_overview": f"{settings.API_PREFIX}/admin/overview",
            "simulation": f"{settings.API_PREFIX}/simulate/roadblock"
        }
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

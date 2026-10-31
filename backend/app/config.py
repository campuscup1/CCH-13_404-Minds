import os

class Settings:
    PROJECT_NAME: str = "Smart Emergency Ambulance Dispatch & Routing System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # JWT Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hackathon-emergency-dispatch-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Simulation settings
    DEFAULT_AVERAGE_SPEED_KMH: float = 45.0  # standard urban ambulance base speed

settings = Settings()

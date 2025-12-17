"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/sigir_db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # API Keys
    OPENWEATHER_API_KEY: str = ""
    MAPBOX_ACCESS_TOKEN: str = ""
    GOOGLE_EARTH_ENGINE_KEY: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8081",
        "exp://192.168.10.43:8081",
        "http://192.168.10.43:8081"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

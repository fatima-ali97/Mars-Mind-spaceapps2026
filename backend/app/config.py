import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and environment configurations."""
    PROJECT_NAME: str = "Mars Mind API"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    
    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS settings (comma-separated or list)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Chatbot configurations
    CHATBOT_NAME: str = "ARES (Autonomous Resource & Exploration Specialist)"
    AI_PROVIDER: str = "mock"  # "mock", "gemini", "openai"
    AI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()


"""Backend settings. Load absolute paths so starting Uvicorn from anywhere works."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = "MarsMind AI Terrain API"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    data_dir: Path = BACKEND_ROOT / "app" / "data"
    default_region: str = "demo-jezero"
    model_config = SettingsConfigDict(env_file=str(BACKEND_ROOT / ".env"), extra="ignore")

settings = Settings()

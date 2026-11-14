"""Shared coordinates (east-positive longitude, degrees)."""
from pydantic import BaseModel, Field

class MarsLocation(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)

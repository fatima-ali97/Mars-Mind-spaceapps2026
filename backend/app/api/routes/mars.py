"""Describe which prepared Mars regions are available."""
from fastapi import APIRouter, HTTPException
from app.schemas.terrain import RegionInfo
from app.services.nasa_service import list_regions, load_region

router = APIRouter(prefix="/mars", tags=["Mars regions"])

@router.get("/regions", response_model=list[RegionInfo])
def regions():
    return list_regions()

@router.get("/regions/{region_id}", response_model=RegionInfo)
def region(region_id: str):
    return load_region(region_id).metadata

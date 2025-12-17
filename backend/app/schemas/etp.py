"""
Evapotranspiration schemas (Pydantic models)
"""
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ETPData(BaseModel):
    date: datetime
    et0: float  # Reference evapotranspiration (mm/day)
    temperature_max: float
    temperature_min: float
    humidity: float
    wind_speed: float
    solar_radiation: float

class ETPCalculation(BaseModel):
    date: datetime
    et0: float  # Reference ET (mm/day)
    kc: float  # Crop coefficient
    etc: float  # Crop evapotranspiration (mm/day)
    recommended_irrigation: float  # mm

class ETPForecast(BaseModel):
    field_id: str
    crop_type: str
    planting_date: datetime
    days_since_planting: int
    current_stage: str
    data: List[ETPCalculation]
    total_water_requirement: float  # mm for the period
    irrigation_efficiency: float
    adjusted_irrigation: float  # considering efficiency

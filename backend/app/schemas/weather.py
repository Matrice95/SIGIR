"""
Weather schemas (Pydantic models)
"""
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class HourlyWeather(BaseModel):
    time: str
    temperature: float
    condition: str
    icon: str

class DailyWeather(BaseModel):
    date: datetime
    temperature_min: float
    temperature_max: float
    humidity: int
    precipitation: float
    wind_speed: float
    condition: str
    icon: str
    hourly: Optional[List[HourlyWeather]] = None

class WeatherForecast(BaseModel):
    location: str
    latitude: float
    longitude: float
    forecast: List[DailyWeather]
    
class WeatherCurrent(BaseModel):
    temperature: float
    humidity: int
    wind_speed: float
    precipitation: float
    condition: str
    icon: str
    timestamp: datetime

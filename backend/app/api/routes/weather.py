"""
Weather routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.weather import WeatherForecast, WeatherCurrent
from app.services.weather_service import weather_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/current", response_model=WeatherCurrent)
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    current_user: dict = Depends(get_current_user)
):
    """Get current weather for a location"""
    try:
        weather = await weather_service.get_current_weather(lat, lon)
        return weather
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {str(e)}")

@router.get("/forecast", response_model=WeatherForecast)
async def get_weather_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=7, description="Number of days"),
    current_user: dict = Depends(get_current_user)
):
    """Get weather forecast for a location"""
    try:
        forecast = await weather_service.get_forecast(lat, lon, days)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching forecast: {str(e)}")

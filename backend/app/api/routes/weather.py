"""
API endpoints pour données météorologiques et satellite
Open-Meteo, NASA POWER (CHIRPS), SRTM, Google Earth Engine
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import httpx
from app.db.session import get_db
from app.models.field import Field
from app.api.deps import get_current_user
from pydantic import BaseModel


router = APIRouter()


# ==================== Modèles Pydantic ====================

class WeatherDay(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    temperature_mean: float
    precipitation_sum: float
    precipitation_probability_max: float
    wind_speed_max: float
    relative_humidity_mean: float
    et0_fao_evapotranspiration: float


class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    current: dict
    daily: List[WeatherDay]


class RainfallPoint(BaseModel):
    date: str
    precipitation: float


class TopographyResponse(BaseModel):
    elevation: float
    slope: float
    aspect: float
    drainageClass: str
    floodRisk: str


class NDVIPoint(BaseModel):
    date: str
    ndvi_mean: float
    ndvi_min: float
    ndvi_max: float
    cloud_coverage: float


# ==================== Open-Meteo API ====================

@router.get("/weather/{field_id}", response_model=WeatherResponse)
async def get_weather_forecast(
    field_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les prévisions météo 7 jours (Open-Meteo)"""
    
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.user_id == current_user.id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": field.latitude,
                    "longitude": field.longitude,
                    "daily": ",".join([
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "temperature_2m_mean",
                        "precipitation_sum",
                        "precipitation_probability_max",
                        "wind_speed_10m_max",
                        "relative_humidity_2m_mean",
                        "et0_fao_evapotranspiration",
                    ]),
                    "current": ",".join([
                        "temperature_2m",
                        "relative_humidity_2m",
                        "wind_speed_10m",
                        "precipitation",
                    ]),
                    "timezone": "Africa/Abidjan",
                    "forecast_days": 7,
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            daily = []
            for i in range(len(data["daily"]["time"])):
                daily.append(WeatherDay(
                    date=data["daily"]["time"][i],
                    temperature_max=data["daily"]["temperature_2m_max"][i],
                    temperature_min=data["daily"]["temperature_2m_min"][i],
                    temperature_mean=data["daily"]["temperature_2m_mean"][i],
                    precipitation_sum=data["daily"]["precipitation_sum"][i],
                    precipitation_probability_max=data["daily"]["precipitation_probability_max"][i],
                    wind_speed_max=data["daily"]["wind_speed_10m_max"][i],
                    relative_humidity_mean=data["daily"]["relative_humidity_2m_mean"][i],
                    et0_fao_evapotranspiration=data["daily"]["et0_fao_evapotranspiration"][i],
                ))
            
            return WeatherResponse(
                latitude=data["latitude"],
                longitude=data["longitude"],
                timezone=data["timezone"],
                current={
                    "temperature": data["current"]["temperature_2m"],
                    "humidity": data["current"]["relative_humidity_2m"],
                    "wind_speed": data["current"]["wind_speed_10m"],
                    "precipitation": data["current"]["precipitation"],
                },
                daily=daily,
            )
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Erreur Open-Meteo API: {str(e)}")


# ==================== NASA POWER (Rainfall) ====================

@router.get("/rainfall/{field_id}", response_model=List[RainfallPoint])
async def get_rainfall_data(
    field_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données de pluie historiques (NASA POWER)"""
    
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.user_id == current_user.id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://power.larc.nasa.gov/api/temporal/daily/point",
                params={
                    "parameters": "PRECTOTCORR",
                    "community": "AG",
                    "longitude": field.longitude,
                    "latitude": field.latitude,
                    "start": start_date.strftime("%Y%m%d"),
                    "end": end_date.strftime("%Y%m%d"),
                    "format": "JSON",
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            
            rainfall_data = []
            for date_str, value in data["properties"]["parameter"]["PRECTOTCORR"].items():
                rainfall_data.append(RainfallPoint(
                    date=f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}",
                    precipitation=value,
                ))
            
            return rainfall_data
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Erreur NASA POWER API: {str(e)}")


# ==================== SRTM (Topographie) ====================

@router.get("/topography/{field_id}", response_model=TopographyResponse)
async def get_topography_data(
    field_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données topographiques (Open-Elevation)"""
    
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.user_id == current_user.id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    try:
        delta = 50 / 111320
        
        points = [
            {"latitude": field.latitude, "longitude": field.longitude},
            {"latitude": field.latitude + delta, "longitude": field.longitude},
            {"latitude": field.latitude - delta, "longitude": field.longitude},
            {"latitude": field.latitude, "longitude": field.longitude + delta},
            {"latitude": field.latitude, "longitude": field.longitude - delta},
        ]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.open-elevation.com/api/v1/lookup",
                json={"locations": points},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            elevations = [r["elevation"] for r in data["results"]]
            center_elevation = elevations[0]
            
            gradients = [abs(elevations[i] - center_elevation) for i in range(1, 5)]
            avg_gradient = sum(gradients) / len(gradients)
            slope = round(abs(avg_gradient / 50) * 100, 2)
            slope_degrees = round(slope * 0.57, 1)
            
            if slope_degrees > 8:
                drainage_class = "excellent"
            elif slope_degrees > 5:
                drainage_class = "good"
            elif slope_degrees > 2:
                drainage_class = "moderate"
            elif slope_degrees > 0.5:
                drainage_class = "poor"
            else:
                drainage_class = "very-poor"
            
            if center_elevation < 100 and slope_degrees < 1:
                flood_risk = "high"
            elif center_elevation < 200 and slope_degrees < 2:
                flood_risk = "medium"
            else:
                flood_risk = "low"
            
            return TopographyResponse(
                elevation=round(center_elevation),
                slope=slope_degrees,
                aspect=0,
                drainageClass=drainage_class,
                floodRisk=flood_risk,
            )
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Erreur Open-Elevation API: {str(e)}")


# ==================== NDVI Google Earth Engine ====================

@router.get("/ndvi/{field_id}", response_model=List[NDVIPoint])
async def get_ndvi_data(
    field_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données NDVI Sentinel-2 (Google Earth Engine)"""
    
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.user_id == current_user.id
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.planting_date:
        raise HTTPException(status_code=400, detail="Parcelle sans date de plantation")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    try:
        # Importer le service GEE
        from app.services.gee_service import gee_service
        
        # Récupérer les données NDVI depuis la date de plantation
        ndvi_data = gee_service.get_sentinel2_ndvi(
            latitude=field.latitude,
            longitude=field.longitude,
            start_date=field.planting_date,
            end_date=datetime.now(),
            radius_meters=100
        )
        
        # Convertir en NDVIPoint
        result = []
        for data in ndvi_data:
            result.append(NDVIPoint(
                date=data['date'],
                ndvi_mean=data['ndvi_mean'],
                ndvi_min=data['ndvi_min'],
                ndvi_max=data['ndvi_max'],
                cloud_coverage=data['cloud_coverage'],
            ))
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération NDVI: {str(e)}")

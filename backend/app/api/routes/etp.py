"""
Evapotranspiration (ETP) routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.field import Field
from app.schemas.etp import ETPForecast
from app.services.etp_service import etp_service
from app.services.weather_service import weather_service
from app.core.security import get_current_user

router = APIRouter()

@router.get("/{field_id}", response_model=ETPForecast)
async def calculate_field_etp(
    field_id: str,
    days: int = Query(7, ge=1, le=14, description="Number of days for forecast"),
    irrigation_efficiency: float = Query(0.75, ge=0.1, le=1.0, description="Irrigation efficiency"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Calculate evapotranspiration for a specific field"""
    # Get field
    field = db.query(Field).filter(
        Field.id == field_id,
        Field.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Verify field has location and planting date
    if not field.latitude or not field.longitude:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field must have location coordinates"
        )
    
    if not field.planting_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field must have planting date"
        )
    
    try:
        # Get weather data
        weather_data = await weather_service.get_weather_data_for_etp(
            field.latitude,
            field.longitude,
            days
        )
        
        # Calculate ETP
        etp_forecast = await etp_service.calculate_etp_forecast(
            field_id=field.id,
            crop_type=field.crop_type,
            planting_date=field.planting_date,
            latitude=field.latitude,
            longitude=field.longitude,
            weather_data=weather_data,
            irrigation_efficiency=irrigation_efficiency
        )
        
        return etp_forecast
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating ETP: {str(e)}"
        )

@router.get("/calculate/manual", response_model=dict)
async def calculate_etp_manual(
    temp_max: float = Query(..., description="Maximum temperature (°C)"),
    temp_min: float = Query(..., description="Minimum temperature (°C)"),
    humidity: float = Query(..., ge=0, le=100, description="Relative humidity (%)"),
    wind_speed: float = Query(..., ge=0, description="Wind speed (m/s)"),
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    days_since_planting: int = Query(0, ge=0, description="Days since planting"),
    current_user: dict = Depends(get_current_user)
):
    """Calculate ET0 with manual weather parameters"""
    try:
        et0 = etp_service.calculate_et0_penman_monteith(
            temp_max=temp_max,
            temp_min=temp_min,
            humidity=humidity,
            wind_speed=wind_speed,
            latitude=latitude,
            date=datetime.now()
        )
        
        # Get crop coefficient
        planting_date = datetime.now() - timedelta(days=days_since_planting)
        kc, stage = etp_service.get_crop_coefficient(planting_date, datetime.now())
        
        etc = et0 * kc
        
        return {
            "et0": round(et0, 2),
            "kc": round(kc, 2),
            "etc": round(etc, 2),
            "growth_stage": stage,
            "days_since_planting": days_since_planting
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating ETP: {str(e)}"
        )

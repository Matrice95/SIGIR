"""
ETP (Evapotranspiration) service using FAO Penman-Monteith equation
"""
import math
from datetime import datetime, timedelta
from typing import List, Tuple
from app.schemas.etp import ETPCalculation, ETPForecast, ETPData

class ETPService:
    # Crop coefficients for rice by growth stage
    RICE_KC = {
        "initial": 1.05,      # 0-20 days
        "development": 1.10,  # 20-40 days
        "mid": 1.20,          # 40-90 days
        "late": 0.90          # 90-120 days
    }
    
    def calculate_et0_penman_monteith(
        self,
        temp_max: float,
        temp_min: float,
        humidity: float,
        wind_speed: float,
        latitude: float,
        date: datetime,
        elevation: float = 0
    ) -> float:
        """
        Calculate reference evapotranspiration (ET0) using FAO Penman-Monteith equation
        
        Args:
            temp_max: Maximum temperature (°C)
            temp_min: Minimum temperature (°C)
            humidity: Relative humidity (%)
            wind_speed: Wind speed at 2m (m/s)
            latitude: Latitude (degrees)
            date: Date of calculation
            elevation: Elevation above sea level (m)
        
        Returns:
            ET0 in mm/day
        """
        # Mean temperature
        temp_mean = (temp_max + temp_min) / 2
        
        # Atmospheric pressure (kPa)
        P = 101.3 * ((293 - 0.0065 * elevation) / 293) ** 5.26
        
        # Psychrometric constant (kPa/°C)
        gamma = 0.665e-3 * P
        
        # Saturation vapor pressure (kPa)
        es_max = 0.6108 * math.exp((17.27 * temp_max) / (temp_max + 237.3))
        es_min = 0.6108 * math.exp((17.27 * temp_min) / (temp_min + 237.3))
        es = (es_max + es_min) / 2
        
        # Actual vapor pressure (kPa)
        ea = es * (humidity / 100)
        
        # Slope of saturation vapor pressure curve (kPa/°C)
        delta = 4098 * es / ((temp_mean + 237.3) ** 2)
        
        # Solar radiation (simplified - should be calculated based on location and date)
        # Using a simplified approximation: Rs = 0.16 * sqrt(temp_max - temp_min) * Ra
        Ra = self._calculate_extraterrestrial_radiation(latitude, date)
        Rs = 0.16 * math.sqrt(max(0, temp_max - temp_min)) * Ra
        
        # Net radiation (MJ/m²/day) - simplified
        Rn = 0.77 * Rs - 0.5  # Rough approximation
        
        # Soil heat flux (negligible for daily calculations)
        G = 0
        
        # ET0 calculation (mm/day)
        numerator = 0.408 * delta * (Rn - G) + gamma * (900 / (temp_mean + 273)) * wind_speed * (es - ea)
        denominator = delta + gamma * (1 + 0.34 * wind_speed)
        
        et0 = numerator / denominator
        
        return max(0, et0)  # ET0 cannot be negative
    
    def _calculate_extraterrestrial_radiation(self, latitude: float, date: datetime) -> float:
        """Calculate extraterrestrial radiation (Ra) in MJ/m²/day"""
        # Day of year
        J = date.timetuple().tm_yday
        
        # Convert latitude to radians
        lat_rad = latitude * math.pi / 180
        
        # Solar declination
        delta = 0.409 * math.sin(2 * math.pi * J / 365 - 1.39)
        
        # Sunset hour angle
        ws = math.acos(-math.tan(lat_rad) * math.tan(delta))
        
        # Inverse relative distance Earth-Sun
        dr = 1 + 0.033 * math.cos(2 * math.pi * J / 365)
        
        # Solar constant
        Gsc = 0.0820  # MJ/m²/min
        
        # Extraterrestrial radiation
        Ra = (24 * 60 / math.pi) * Gsc * dr * (
            ws * math.sin(lat_rad) * math.sin(delta) +
            math.cos(lat_rad) * math.cos(delta) * math.sin(ws)
        )
        
        return Ra
    
    def get_crop_coefficient(self, planting_date: datetime, current_date: datetime) -> Tuple[float, str]:
        """
        Get crop coefficient (Kc) based on growth stage
        
        Returns:
            Tuple of (Kc value, stage name)
        """
        days_since_planting = (current_date - planting_date).days
        
        if days_since_planting < 0:
            return 0.0, "not_planted"
        elif days_since_planting <= 20:
            return self.RICE_KC["initial"], "initial"
        elif days_since_planting <= 40:
            return self.RICE_KC["development"], "development"
        elif days_since_planting <= 90:
            return self.RICE_KC["mid"], "mid"
        elif days_since_planting <= 120:
            return self.RICE_KC["late"], "late"
        else:
            return 0.0, "harvested"
    
    async def calculate_etp_forecast(
        self,
        field_id: str,
        crop_type: str,
        planting_date: datetime,
        latitude: float,
        longitude: float,
        weather_data: List[dict],
        irrigation_efficiency: float = 0.75
    ) -> ETPForecast:
        """
        Calculate ETP forecast for a field
        
        Args:
            field_id: Field ID
            crop_type: Type of crop
            planting_date: Date of planting
            latitude: Field latitude
            longitude: Field longitude
            weather_data: List of weather forecasts
            irrigation_efficiency: Irrigation system efficiency (0-1)
        """
        calculations = []
        total_etc = 0
        
        for weather in weather_data:
            date = weather["date"]
            
            # Calculate ET0
            et0 = self.calculate_et0_penman_monteith(
                temp_max=weather["temp_max"],
                temp_min=weather["temp_min"],
                humidity=weather["humidity"],
                wind_speed=weather["wind_speed"],
                latitude=latitude,
                date=date
            )
            
            # Get crop coefficient
            kc, stage = self.get_crop_coefficient(planting_date, date)
            
            # Calculate crop evapotranspiration (ETc)
            etc = et0 * kc
            total_etc += etc
            
            # Recommended irrigation (accounting for efficiency)
            recommended_irrigation = etc / irrigation_efficiency if kc > 0 else 0
            
            calculations.append(ETPCalculation(
                date=date,
                et0=round(et0, 2),
                kc=round(kc, 2),
                etc=round(etc, 2),
                recommended_irrigation=round(recommended_irrigation, 2)
            ))
        
        days_since_planting = (datetime.now() - planting_date).days
        _, current_stage = self.get_crop_coefficient(planting_date, datetime.now())
        
        return ETPForecast(
            field_id=field_id,
            crop_type=crop_type,
            planting_date=planting_date,
            days_since_planting=days_since_planting,
            current_stage=current_stage,
            data=calculations,
            total_water_requirement=round(total_etc, 2),
            irrigation_efficiency=irrigation_efficiency,
            adjusted_irrigation=round(total_etc / irrigation_efficiency, 2)
        )

etp_service = ETPService()

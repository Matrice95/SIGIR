"""
Weather service - Integration with OpenWeatherMap API
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Optional
from app.core.config import settings
from app.schemas.weather import WeatherForecast, DailyWeather, HourlyWeather, WeatherCurrent

class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    async def get_current_weather(self, lat: float, lon: float) -> WeatherCurrent:
        """Get current weather for a location"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return WeatherCurrent(
                temperature=data["main"]["temp"],
                humidity=data["main"]["humidity"],
                wind_speed=data["wind"]["speed"],
                precipitation=data.get("rain", {}).get("1h", 0),
                condition=data["weather"][0]["main"],
                icon=data["weather"][0]["icon"],
                timestamp=datetime.fromtimestamp(data["dt"])
            )
    
    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> WeatherForecast:
        """Get weather forecast for a location"""
        async with httpx.AsyncClient() as client:
            # Get 5-day forecast (3-hour intervals)
            response = await client.get(
                f"{self.base_url}/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": self.api_key,
                    "units": "metric"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Process forecast data
            daily_forecasts = self._process_forecast_data(data["list"])
            
            return WeatherForecast(
                location=data["city"]["name"],
                latitude=lat,
                longitude=lon,
                forecast=daily_forecasts[:days]
            )
    
    def _process_forecast_data(self, forecast_list: List[dict]) -> List[DailyWeather]:
        """Process raw forecast data into daily summaries"""
        daily_data = {}
        
        for item in forecast_list:
            date = datetime.fromtimestamp(item["dt"]).date()
            
            if date not in daily_data:
                daily_data[date] = {
                    "temps": [],
                    "humidity": [],
                    "precipitation": 0,
                    "wind_speeds": [],
                    "conditions": [],
                    "hourly": []
                }
            
            daily_data[date]["temps"].append(item["main"]["temp"])
            daily_data[date]["humidity"].append(item["main"]["humidity"])
            daily_data[date]["precipitation"] += item.get("rain", {}).get("3h", 0)
            daily_data[date]["wind_speeds"].append(item["wind"]["speed"])
            daily_data[date]["conditions"].append(item["weather"][0]["main"])
            
            # Add hourly data
            time_str = datetime.fromtimestamp(item["dt"]).strftime("%H:%M")
            daily_data[date]["hourly"].append(HourlyWeather(
                time=time_str,
                temperature=item["main"]["temp"],
                condition=item["weather"][0]["main"],
                icon=item["weather"][0]["icon"]
            ))
        
        # Convert to DailyWeather objects
        result = []
        for date, data in sorted(daily_data.items()):
            result.append(DailyWeather(
                date=datetime.combine(date, datetime.min.time()),
                temperature_min=min(data["temps"]),
                temperature_max=max(data["temps"]),
                humidity=int(sum(data["humidity"]) / len(data["humidity"])),
                precipitation=data["precipitation"],
                wind_speed=sum(data["wind_speeds"]) / len(data["wind_speeds"]),
                condition=max(set(data["conditions"]), key=data["conditions"].count),
                icon="01d",  # Default icon
                hourly=data["hourly"]
            ))
        
        return result
    
    async def get_weather_data_for_etp(
        self,
        lat: float,
        lon: float,
        days: int = 7
    ) -> List[dict]:
        """Get weather data needed for ETP calculation"""
        forecast = await self.get_forecast(lat, lon, days)
        
        return [
            {
                "date": day.date,
                "temp_max": day.temperature_max,
                "temp_min": day.temperature_min,
                "humidity": day.humidity,
                "wind_speed": day.wind_speed
            }
            for day in forecast.forecast
        ]

weather_service = WeatherService()

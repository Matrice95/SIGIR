"""
API endpoints pour données météorologiques et satellite
Open-Meteo, NASA POWER (CHIRPS), SRTM, Google Earth Engine
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import httpx
import os
from app.db.database import get_db
from app.models.field import Field as FieldModel
from app.core.security import get_current_user
from pydantic import BaseModel, Field


router = APIRouter()

# ==================== Initialisation Google Earth Engine ====================
_gee_initialized = False

def init_gee():
    """Initialiser Google Earth Engine une seule fois"""
    global _gee_initialized
    if _gee_initialized:
        return True
    
    try:
        import ee
        service_account_file = 'gee-service-account.json'
        
        if os.path.exists(service_account_file):
            credentials = ee.ServiceAccountCredentials(None, service_account_file)
            ee.Initialize(credentials)
            _gee_initialized = True
            print("✅ Google Earth Engine initialisé avec succès")
            return True
        else:
            print("⚠️ Fichier clé GEE non trouvé, utilisation de données simulées")
            return False
    except Exception as e:
        print(f"⚠️ Erreur initialisation GEE: {e}")
        return False

# Initialiser GEE au démarrage
init_gee()


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
    field_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les prévisions météo 7 jours (Open-Meteo)"""
    
    field = db.query(FieldModel).filter(
        FieldModel.id == field_id,
        FieldModel.owner_id == current_user["id"]
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
    field_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données de pluie historiques (NASA POWER)"""
    
    field = db.query(FieldModel).filter(
        FieldModel.id == field_id,
        FieldModel.owner_id == current_user["id"]
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
    field_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données topographiques (Open-Elevation)"""
    
    field = db.query(FieldModel).filter(
        FieldModel.id == field_id,
        FieldModel.owner_id == current_user["id"]
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

def get_real_ndvi_from_gee(latitude: float, longitude: float, start_date: datetime, days_interval: int = 10):
    """Récupérer les vraies données NDVI depuis Google Earth Engine"""
    try:
        import ee
        
        # Vérifier que GEE est initialisé
        if not _gee_initialized:
            raise Exception("GEE non initialisé")
        
        # Point d'intérêt
        point = ee.Geometry.Point([longitude, latitude])
        buffer_zone = point.buffer(500)  # 500m autour du point
        
        # Dates
        end_date = datetime.now()
        
        # Collection Sentinel-2
        collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(buffer_zone) \
            .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
        
        # Fonction pour calculer NDVI
        def calculate_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return ndvi.set('system:time_start', image.get('system:time_start')) \
                      .set('CLOUDY_PIXEL_PERCENTAGE', image.get('CLOUDY_PIXEL_PERCENTAGE'))
        
        ndvi_collection = collection.map(calculate_ndvi)
        
        # Récupérer les statistiques (OPTIMISÉ: limité à 10 images max)
        ndvi_list = []
        images = ndvi_collection.toList(ndvi_collection.size())
        size = images.size().getInfo()
        
        # Limiter à 10 images pour éviter timeout
        max_images = min(size, 10)
        print(f"📊 Traitement de {max_images} images Sentinel-2...")
        
        for i in range(max_images):
            image = ee.Image(images.get(i))
            
            stats = image.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    reducer2=ee.Reducer.minMax(),
                    sharedInputs=True
                ),
                geometry=buffer_zone,
                scale=20,  # Augmenté à 20m pour plus de rapidité
                maxPixels=1e8  # Réduit pour plus de rapidité
            ).getInfo()
            
            timestamp = image.get('system:time_start').getInfo()
            cloud_cover = image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()
            date = datetime.fromtimestamp(timestamp / 1000)
            
            ndvi_mean = stats.get('NDVI_mean', 0)
            
            ndvi_list.append({
                'date': date.strftime('%Y-%m-%d'),
                'ndvi_mean': round(ndvi_mean, 3),
                'ndvi_min': round(stats.get('NDVI_min', 0), 3),
                'ndvi_max': round(stats.get('NDVI_max', 0), 3),
                'cloud_coverage': round(cloud_cover, 1)
            })
        
        return sorted(ndvi_list, key=lambda x: x['date'])
        
    except Exception as e:
        print(f"Erreur GEE: {e}")
        return None


def get_simulated_ndvi(planting_date: datetime):
    """Fallback: données NDVI simulées"""
    days_since_planting = (datetime.now() - planting_date).days
    ndvi_data = []
    
    for day in range(0, min(days_since_planting, 120), 10):
        if day < 20:
            ndvi_mean = 0.2 + (day / 20) * 0.2
        elif day < 60:
            ndvi_mean = 0.4 + ((day - 20) / 40) * 0.3
        elif day < 90:
            ndvi_mean = 0.7 + ((day - 60) / 30) * 0.1
        else:
            ndvi_mean = 0.8 - ((day - 90) / 30) * 0.3
        
        date = planting_date + timedelta(days=day)
        ndvi_data.append({
            'date': date.strftime("%Y-%m-%d"),
            'ndvi_mean': round(ndvi_mean, 2),
            'ndvi_min': round(ndvi_mean - 0.05, 2),
            'ndvi_max': round(ndvi_mean + 0.05, 2),
            'cloud_coverage': 10.0,
        })
    
    return ndvi_data


@router.get("/ndvi/{field_id}", response_model=List[NDVIPoint])
async def get_ndvi_data(
    field_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Récupérer les données NDVI depuis Google Earth Engine (Sentinel-2)"""
    
    field = db.query(FieldModel).filter(
        FieldModel.id == field_id,
        FieldModel.owner_id == current_user["id"]
    ).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.planting_date:
        raise HTTPException(status_code=400, detail="Parcelle sans date de plantation")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    # Essayer d'abord les vraies données GEE
    ndvi_data = get_real_ndvi_from_gee(field.latitude, field.longitude, field.planting_date)
    
    # Fallback sur données simulées si erreur GEE
    if not ndvi_data or len(ndvi_data) == 0:
        print("⚠️ Utilisation des données NDVI simulées (pas de données GEE)")
        ndvi_data = get_simulated_ndvi(field.planting_date)
    else:
        print(f"✅ {len(ndvi_data)} mesures NDVI réelles récupérées depuis GEE")
    
    return [NDVIPoint(**data) for data in ndvi_data]


# ==================== SMI & Recommandations Irrigation ====================

class SMIResponse(BaseModel):
    """Réponse complète SMI + Recommandations"""
    smi: float
    smi_class: str
    swdi: float
    swdi_class: str
    components: dict
    confidence: int
    flood_risk: dict
    recommendation: dict
    field_info: dict
    timestamp: str


@router.get("/smi-test/{field_id}", response_model=SMIResponse)
async def get_soil_moisture_index_test(field_id: str, db: Session = Depends(get_db)):
    """
    Test SMI endpoint sans authentification
    """
    return await _calculate_smi(field_id, db)


@router.get("/smi/{field_id}", response_model=SMIResponse)
async def get_soil_moisture_index(
    field_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Calculer SMI avec authentification"""
    return await _calculate_smi(field_id, db)


async def _calculate_smi(field_id: str, db: Session):
    """
    Logique commune calcul SMI
    """
    from app.services.soil_moisture import soil_moisture_service
    from app.services.irrigation_recommendations import irrigation_recommendation_service
    
    field = db.query(FieldModel).filter(FieldModel.id == field_id).first()
    
    if not field:
        raise HTTPException(status_code=404, detail="Parcelle non trouvée")
    
    if not field.latitude or not field.longitude:
        raise HTTPException(status_code=400, detail="Parcelle sans localisation GPS")
    
    if not field.planting_date:
        raise HTTPException(status_code=400, detail="Parcelle sans date de plantation")
    
    try:
        # === 1. RÉCUPÉRER NDVI/NDWI depuis Sentinel-2 ===
        import ee
        
        if not _gee_initialized:
            raise HTTPException(status_code=503, detail="Google Earth Engine non disponible")
        
        # Créer point géographique
        point = ee.Geometry.Point([field.longitude, field.latitude])
        
        # Récupérer dernière image Sentinel-2 (30 jours)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
            .filterBounds(point) \
            .filterDate(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)) \
            .select(['B4', 'B8', 'B11']) \
            .sort('system:time_start', False)
        
        image_count = collection.size().getInfo()
        
        if image_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Aucune image Sentinel-2 récente (< 30 jours) disponible"
            )
        
        # Prendre la dernière image
        latest_image = ee.Image(collection.first())
        
        # Extraire valeurs spectrales
        scale = 20
        sample = latest_image.sample(
            region=point.buffer(50),
            scale=scale,
            numPixels=10
        ).getInfo()
        
        if not sample['features'] or len(sample['features']) == 0:
            raise HTTPException(status_code=404, detail="Pas de données spectrales disponibles")
        
        # Moyenne des pixels
        b4_values = [f['properties'].get('B4', 0) for f in sample['features'] if 'B4' in f['properties']]
        b8_values = [f['properties'].get('B8', 0) for f in sample['features'] if 'B8' in f['properties']]
        b11_values = [f['properties'].get('B11', 0) for f in sample['features'] if 'B11' in f['properties']]
        
        if not b4_values or not b8_values or not b11_values:
            raise HTTPException(status_code=404, detail="Valeurs spectrales incomplètes")
        
        red = sum(b4_values) / len(b4_values)
        nir = sum(b8_values) / len(b8_values)
        swir = sum(b11_values) / len(b11_values)
        
        # Calculer NDVI
        if (nir + red) > 0:
            ndvi = (nir - red) / (nir + red)
        else:
            ndvi = 0.0
        
        # Calculer NDWI (NIR - SWIR) / (NIR + SWIR)
        ndwi = soil_moisture_service.calculate_ndwi(nir, swir)
        
        print(f"✅ Sentinel-2: NDVI={ndvi:.3f}, NDWI={ndwi:.3f}")
        
        # === 2. RÉCUPÉRER PLUVIOMÉTRIE (NASA POWER) ===
        end_date_str = datetime.now().strftime("%Y%m%d")
        start_date_str = (datetime.now() - timedelta(days=7)).strftime("%Y%m%d")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://power.larc.nasa.gov/api/temporal/daily/point",
                params={
                    "parameters": "PRECTOTCORR",
                    "community": "AG",
                    "longitude": field.longitude,
                    "latitude": field.latitude,
                    "start": start_date_str,
                    "end": end_date_str,
                    "format": "JSON"
                },
                timeout=30.0
            )
            response.raise_for_status()
            rain_data = response.json()
        
        rainfall_7d = sum([
            v for v in rain_data["properties"]["parameter"]["PRECTOTCORR"].values()
            if v != -999
        ])
        
        print(f"✅ Pluviométrie 7j: {rainfall_7d:.1f}mm")
        
        # === 3. RÉCUPÉRER TEMPÉRATURE MOYENNE (Open-Meteo) ===
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": field.latitude,
                    "longitude": field.longitude,
                    "daily": "temperature_2m_mean,precipitation_sum",
                    "timezone": "Africa/Abidjan",
                    "forecast_days": 7,
                    "past_days": 7
                },
                timeout=30.0
            )
            response.raise_for_status()
            weather_data = response.json()
        
        # Température moyenne des 7 derniers jours
        temps_past = weather_data["daily"]["temperature_2m_mean"][:7]
        temp_avg = sum(temps_past) / len(temps_past)
        
        # Pluies prévues 7 prochains jours
        rainfall_forecast = sum(weather_data["daily"]["precipitation_sum"][7:])
        
        print(f"✅ Température moy: {temp_avg:.1f}°C, Pluies prévues: {rainfall_forecast:.1f}mm")
        
        # === 4. RÉCUPÉRER TOPOGRAPHIE (SRTM) ===
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-elevation.com/api/v1/lookup",
                params={
                    "locations": f"{field.latitude},{field.longitude}"
                },
                timeout=30.0
            )
            response.raise_for_status()
            topo_data = response.json()
        
        elevation = topo_data["results"][0]["elevation"]
        
        # Estimation pente/drainage (simplifié)
        slope = 0.0  # TODO: Calculer avec images DEM
        drainage_class = "moderate"  # TODO: Déterminer via analyse spatiale
        
        print(f"✅ Topographie: {elevation}m, pente={slope}°")
        
        # === 5. DÉTERMINER TYPE SOL ===
        # TODO: Intégrer base de données sols ou SoilGrids API
        soil_type = "sol_argilo_limoneux"  # Type dominant Côte d'Ivoire
        
        # === 6. CALCULER SMI ===
        smi_result = soil_moisture_service.calculate_smi_multiindex(
            ndvi=ndvi,
            ndwi=ndwi,
            rainfall_7d=rainfall_7d,
            temperature_avg=temp_avg,
            soil_type=soil_type
        )
        
        # === 7. CALCULER SWDI ===
        swdi_result = soil_moisture_service.calculate_swdi(
            ndvi=ndvi,
            ndwi=ndwi,
            soil_type=soil_type
        )
        
        # === 8. ÉVALUER RISQUE INONDATION ===
        flood_risk = soil_moisture_service.assess_flood_risk(
            smi=smi_result["smi"],
            rainfall_forecast_7d=rainfall_forecast,
            slope=slope,
            drainage_class=drainage_class,
            elevation=elevation
        )
        
        # === 9. STADE PHÉNOLOGIQUE ===
        phenology_stage = irrigation_recommendation_service.get_phenology_stage(
            field.planting_date
        )
        
        # === 10. GÉNÉRER RECOMMANDATION ===
        recommendation = irrigation_recommendation_service.generate_recommendation(
            field_id=field_id,
            smi_data=smi_result,
            phenology_stage=phenology_stage,
            rainfall_forecast_7d=rainfall_forecast,
            temperature_forecast_avg=temp_avg,
            flood_risk=flood_risk
        )
        
        # === RÉPONSE COMPLÈTE ===
        return SMIResponse(
            smi=smi_result["smi"],
            smi_class=smi_result["smi_class"],
            swdi=swdi_result["swdi"],
            swdi_class=swdi_result["swdi_class"],
            components=smi_result["components"],
            confidence=smi_result["confidence"],
            flood_risk={
                "risk_level": flood_risk["risk_level"],
                "risk_score": flood_risk["risk_score"],
                "warnings": flood_risk["warnings"],
                "days_until_saturation": flood_risk.get("days_until_saturation")
            },
            recommendation=recommendation,
            field_info={
                "phenology_stage": phenology_stage,
                "soil_type": soil_type,
                "elevation": elevation,
                "rainfall_7d": round(rainfall_7d, 1),
                "rainfall_forecast_7d": round(rainfall_forecast, 1),
                "temperature_avg": round(temp_avg, 1),
                "ndvi": round(ndvi, 3),
                "ndwi": round(ndwi, 3)
            },
            timestamp=datetime.now().isoformat()
        )
    
    except ee.EEException as e:
        raise HTTPException(status_code=503, detail=f"Erreur Google Earth Engine: {str(e)}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Erreur API externe: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur calcul SMI: {str(e)}")

"""
Google Earth Engine Service
Récupération des données NDVI Sentinel-2
"""

import ee
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

# Configuration
GEE_SERVICE_ACCOUNT = "ee-metamatrice95@ee-metamatrice95.iam.gserviceaccount.com"
GEE_PRIVATE_KEY_PATH = "credentials/gee-private-key.json"


class GoogleEarthEngineService:
    def __init__(self):
        self.initialized = False
        self._initialize()
    
    def _initialize(self):
        """Initialiser Google Earth Engine"""
        try:
            # Authentification avec service account
            credentials = ee.ServiceAccountCredentials(
                GEE_SERVICE_ACCOUNT, 
                GEE_PRIVATE_KEY_PATH
            )
            ee.Initialize(credentials)
            self.initialized = True
            print("✅ Google Earth Engine initialisé")
        except Exception as e:
            print(f"⚠️ GEE non disponible: {e}")
            self.initialized = False
    
    def get_sentinel2_ndvi(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime = None,
        radius_meters: int = 100
    ) -> List[Dict]:
        """
        Récupérer les données NDVI Sentinel-2
        
        Args:
            latitude: Latitude du point
            longitude: Longitude du point
            start_date: Date de début
            end_date: Date de fin (par défaut: aujourd'hui)
            radius_meters: Rayon de la zone (défaut: 100m)
        
        Returns:
            Liste de dictionnaires avec date, NDVI moyen, min, max, cloud coverage
        """
        if not self.initialized:
            return self._get_simulated_ndvi(start_date, end_date or datetime.now())
        
        try:
            if end_date is None:
                end_date = datetime.now()
            
            # Créer le point géographique
            point = ee.Geometry.Point([longitude, latitude])
            region = point.buffer(radius_meters)
            
            # Charger la collection Sentinel-2 Level-2A (atmosphériquement corrigée)
            collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
                .filterBounds(region) \
                .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
            
            # Fonction pour calculer NDVI
            def calculate_ndvi(image):
                ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
                return image.addBands(ndvi)
            
            # Appliquer le calcul NDVI
            collection_ndvi = collection.map(calculate_ndvi)
            
            # Extraire les statistiques pour chaque image
            def extract_stats(image):
                stats = image.select('NDVI').reduceRegion(
                    reducer=ee.Reducer.mean().combine(
                        ee.Reducer.min(), '', True
                    ).combine(
                        ee.Reducer.max(), '', True
                    ).combine(
                        ee.Reducer.stdDev(), '', True
                    ),
                    geometry=region,
                    scale=10,
                    maxPixels=1e9
                )
                
                cloud_coverage = image.get('CLOUDY_PIXEL_PERCENTAGE')
                
                return ee.Feature(None, {
                    'date': image.date().format('YYYY-MM-dd'),
                    'ndvi_mean': stats.get('NDVI_mean'),
                    'ndvi_min': stats.get('NDVI_min'),
                    'ndvi_max': stats.get('NDVI_max'),
                    'ndvi_std': stats.get('NDVI_stdDev'),
                    'cloud_coverage': cloud_coverage,
                    'image_id': image.id()
                })
            
            # Extraire les features
            features = collection_ndvi.map(extract_stats)
            feature_list = features.getInfo()
            
            # Formater les résultats
            results = []
            for feature in feature_list['features']:
                props = feature['properties']
                if props['ndvi_mean'] is not None:
                    results.append({
                        'date': props['date'],
                        'ndvi_mean': round(float(props['ndvi_mean']), 3),
                        'ndvi_min': round(float(props['ndvi_min']), 3),
                        'ndvi_max': round(float(props['ndvi_max']), 3),
                        'ndvi_std': round(float(props['ndvi_std']), 3),
                        'cloud_coverage': float(props['cloud_coverage']),
                        'image_id': props['image_id']
                    })
            
            # Trier par date
            results.sort(key=lambda x: x['date'])
            
            print(f"✅ Récupéré {len(results)} images NDVI Sentinel-2")
            return results
        
        except Exception as e:
            print(f"❌ Erreur GEE: {e}")
            return self._get_simulated_ndvi(start_date, end_date or datetime.now())
    
    def get_sentinel2_image_url(
        self,
        latitude: float,
        longitude: float,
        date: datetime,
        bands: List[str] = ['B4', 'B3', 'B2'],
        min_val: int = 0,
        max_val: int = 3000
    ) -> Optional[str]:
        """
        Obtenir l'URL d'une image Sentinel-2 pour affichage sur carte
        
        Args:
            latitude: Latitude
            longitude: Longitude
            date: Date de l'image
            bands: Bandes à afficher (défaut: RGB = B4,B3,B2)
            min_val: Valeur minimale pour normalisation
            max_val: Valeur maximale pour normalisation
        
        Returns:
            URL de l'image ou None
        """
        if not self.initialized:
            return None
        
        try:
            point = ee.Geometry.Point([longitude, latitude])
            
            # Trouver l'image la plus proche de la date
            image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
                .filterBounds(point) \
                .filterDate(
                    (date - timedelta(days=5)).strftime('%Y-%m-%d'),
                    (date + timedelta(days=5)).strftime('%Y-%m-%d')
                ) \
                .sort('CLOUDY_PIXEL_PERCENTAGE') \
                .first()
            
            # Créer URL de visualisation
            vis_params = {
                'bands': bands,
                'min': min_val,
                'max': max_val,
            }
            
            url = image.getThumbURL({
                'region': point.buffer(1000).bounds().getInfo()['coordinates'],
                'dimensions': 512,
                'format': 'png',
                **vis_params
            })
            
            return url
        
        except Exception as e:
            print(f"❌ Erreur création URL: {e}")
            return None
    
    def get_ndvi_image_url(
        self,
        latitude: float,
        longitude: float,
        date: datetime,
        radius_meters: int = 1000
    ) -> Optional[str]:
        """
        Obtenir l'URL d'une image NDVI colorée
        
        Args:
            latitude: Latitude
            longitude: Longitude
            date: Date de l'image
            radius_meters: Rayon de la zone
        
        Returns:
            URL de l'image NDVI ou None
        """
        if not self.initialized:
            return None
        
        try:
            point = ee.Geometry.Point([longitude, latitude])
            region = point.buffer(radius_meters)
            
            # Récupérer image
            image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
                .filterBounds(region) \
                .filterDate(
                    (date - timedelta(days=5)).strftime('%Y-%m-%d'),
                    (date + timedelta(days=5)).strftime('%Y-%m-%d')
                ) \
                .sort('CLOUDY_PIXEL_PERCENTAGE') \
                .first()
            
            # Calculer NDVI
            ndvi = image.normalizedDifference(['B8', 'B4'])
            
            # Palette de couleurs NDVI
            ndvi_vis = {
                'min': -0.2,
                'max': 1.0,
                'palette': [
                    '8B4513',  # Brun (sol nu)
                    'FF8C00',  # Orange (végétation rare)
                    'FFFF00',  # Jaune (faible)
                    '90EE90',  # Vert clair (modéré)
                    '228B22',  # Vert forêt (bon)
                    '006400'   # Vert foncé (excellent)
                ]
            }
            
            url = ndvi.getThumbURL({
                'region': region.bounds().getInfo()['coordinates'],
                'dimensions': 512,
                'format': 'png',
                **ndvi_vis
            })
            
            return url
        
        except Exception as e:
            print(f"❌ Erreur création URL NDVI: {e}")
            return None
    
    def _get_simulated_ndvi(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Données NDVI simulées (fallback)"""
        results = []
        current = start_date
        day_count = 0
        
        while current <= end_date:
            if day_count % 10 == 0:  # Tous les 10 jours
                # Courbe de croissance du riz
                days_since_start = (current - start_date).days
                
                if days_since_start < 20:
                    ndvi_mean = 0.2 + (days_since_start / 20) * 0.2
                elif days_since_start < 60:
                    ndvi_mean = 0.4 + ((days_since_start - 20) / 40) * 0.3
                elif days_since_start < 90:
                    ndvi_mean = 0.7 + ((days_since_start - 60) / 30) * 0.1
                else:
                    ndvi_mean = 0.8 - ((days_since_start - 90) / 30) * 0.3
                
                results.append({
                    'date': current.strftime('%Y-%m-%d'),
                    'ndvi_mean': round(ndvi_mean, 3),
                    'ndvi_min': round(ndvi_mean - 0.05, 3),
                    'ndvi_max': round(ndvi_mean + 0.05, 3),
                    'ndvi_std': 0.05,
                    'cloud_coverage': 10.0,
                    'image_id': f'SIMULATED_{current.strftime("%Y%m%d")}'
                })
            
            current += timedelta(days=1)
            day_count += 1
        
        return results


# Instance globale
gee_service = GoogleEarthEngineService()

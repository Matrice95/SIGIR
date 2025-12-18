"""
Google Earth Engine Service
NDVI Sentinel-2 pour surveillance de la végétation
Account: ee-metamatrice95
"""

import ee
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from pathlib import Path


class GoogleEarthEngineService:
    def __init__(self):
        self.initialized = False
        self.service_account = 'ee-metamatrice95@appspot.gserviceaccount.com'
        self.project_id = 'ee-metamatrice95'
        
    def initialize(self):
        """Initialiser Google Earth Engine"""
        if self.initialized:
            return True
            
        try:
            # Chercher la clé privée
            key_file = Path(__file__).parent.parent.parent / 'gee-key.json'
            
            if key_file.exists():
                credentials = ee.ServiceAccountCredentials(
                    self.service_account,
                    str(key_file)
                )
                ee.Initialize(credentials, project=self.project_id)
                self.initialized = True
                print("✅ Google Earth Engine initialisé avec succès")
                return True
            else:
                print(f"⚠️ Clé GEE non trouvée: {key_file}")
                return False
                
        except Exception as e:
            print(f"❌ Erreur initialisation GEE: {e}")
            return False
    
    def get_ndvi_sentinel2(
        self,
        latitude: float,
        longitude: float,
        radius_meters: int = 100,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[Dict]:
        """
        Récupérer les données NDVI Sentinel-2 pour une parcelle
        
        Args:
            latitude: Latitude du centre de la parcelle
            longitude: Longitude du centre de la parcelle
            radius_meters: Rayon en mètres autour du point
            start_date: Date de début (défaut: 120 jours avant aujourd'hui)
            end_date: Date de fin (défaut: aujourd'hui)
        
        Returns:
            Liste de dictionnaires avec date, ndvi_mean, ndvi_min, ndvi_max, cloud_coverage
        """
        if not self.initialize():
            return self._get_simulated_ndvi(start_date or datetime.now() - timedelta(days=120))
        
        try:
            # Définir la zone d'intérêt
            point = ee.Geometry.Point([longitude, latitude])
            roi = point.buffer(radius_meters)
            
            # Dates
            if not end_date:
                end_date = datetime.now()
            if not start_date:
                start_date = end_date - timedelta(days=120)
            
            # Collection Sentinel-2 Surface Reflectance Harmonized
            s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterBounds(roi)
                  .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)))
            
            # Fonction pour calculer NDVI
            def add_ndvi(image):
                ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
                return image.addBands(ndvi)
            
            # Appliquer NDVI à toutes les images
            s2_ndvi = s2.map(add_ndvi)
            
            # Extraire les valeurs
            def extract_ndvi(image):
                stats = image.select('NDVI').reduceRegion(
                    reducer=ee.Reducer.mean().combine(
                        ee.Reducer.minMax(), sharedInputs=True
                    ).combine(
                        ee.Reducer.stdDev(), sharedInputs=True
                    ),
                    geometry=roi,
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
            
            # Extraire les données
            features = s2_ndvi.map(extract_ndvi)
            data = features.getInfo()
            
            # Formater les résultats
            results = []
            for feature in data['features']:
                props = feature['properties']
                if props.get('ndvi_mean') is not None:
                    results.append({
                        'date': props['date'],
                        'ndvi_mean': round(props['ndvi_mean'], 3),
                        'ndvi_min': round(props.get('ndvi_min', 0), 3),
                        'ndvi_max': round(props.get('ndvi_max', 0), 3),
                        'ndvi_std': round(props.get('ndvi_std', 0), 3),
                        'cloud_coverage': round(props.get('cloud_coverage', 0), 1),
                        'image_id': props.get('image_id', '')
                    })
            
            # Trier par date
            results.sort(key=lambda x: x['date'])
            
            print(f"✅ {len(results)} images NDVI récupérées de Sentinel-2")
            return results
            
        except Exception as e:
            print(f"❌ Erreur récupération NDVI: {e}")
            return self._get_simulated_ndvi(start_date or datetime.now() - timedelta(days=120))
    
    def analyze_vegetation_health(self, ndvi_data: List[Dict]) -> Dict:
        """
        Analyser la santé de la végétation basée sur les données NDVI
        
        Returns:
            Dict avec status, ndvi, trend, recommendations
        """
        if not ndvi_data:
            return {
                'status': 'critical',
                'ndvi': 0.0,
                'trend': 'stable',
                'recommendations': ['Aucune donnée NDVI disponible']
            }
        
        # NDVI moyen récent
        recent_ndvi = ndvi_data[-1]['ndvi_mean']
        
        # Déterminer le statut
        if recent_ndvi >= 0.7:
            status = 'excellent'
        elif recent_ndvi >= 0.5:
            status = 'good'
        elif recent_ndvi >= 0.3:
            status = 'moderate'
        elif recent_ndvi >= 0.1:
            status = 'poor'
        else:
            status = 'critical'
        
        # Calculer la tendance (sur 3 dernières mesures)
        trend = 'stable'
        if len(ndvi_data) >= 3:
            recent_values = [d['ndvi_mean'] for d in ndvi_data[-3:]]
            slope = (recent_values[-1] - recent_values[0]) / 2
            if slope > 0.05:
                trend = 'improving'
            elif slope < -0.05:
                trend = 'declining'
        
        # Recommandations
        recommendations = []
        if status == 'excellent':
            recommendations.append('✅ Végétation en excellente santé')
            recommendations.append('Continuer les pratiques actuelles')
        elif status == 'good':
            recommendations.append('✅ Végétation en bonne santé')
            recommendations.append('Maintenir irrigation et fertilisation')
        elif status == 'moderate':
            recommendations.append('⚠️ Végétation modérée')
            recommendations.append('Vérifier irrigation et nutriments')
        elif status == 'poor':
            recommendations.append('⚠️ Végétation faible')
            recommendations.append('Augmenter irrigation')
            recommendations.append('Appliquer engrais NPK')
        else:
            recommendations.append('🚨 Végétation critique')
            recommendations.append('Intervention urgente requise')
            recommendations.append('Vérifier maladies et ravageurs')
        
        if trend == 'declining':
            recommendations.append('📉 Tendance à la baisse - Action rapide nécessaire')
        elif trend == 'improving':
            recommendations.append('📈 Tendance à la hausse - Bon signe')
        
        return {
            'status': status,
            'ndvi': round(recent_ndvi, 3),
            'trend': trend,
            'recommendations': recommendations
        }
    
    def _get_simulated_ndvi(self, start_date: datetime) -> List[Dict]:
        """Générer des données NDVI simulées (fallback)"""
        data = []
        current = start_date
        days_since_start = 0
        
        while current <= datetime.now():
            if days_since_start % 10 == 0:
                # Courbe de croissance du riz
                if days_since_start < 20:
                    ndvi_mean = 0.2 + (days_since_start / 20) * 0.2
                elif days_since_start < 60:
                    ndvi_mean = 0.4 + ((days_since_start - 20) / 40) * 0.3
                elif days_since_start < 90:
                    ndvi_mean = 0.7 + ((days_since_start - 60) / 30) * 0.1
                elif days_since_start < 120:
                    ndvi_mean = 0.8 - ((days_since_start - 90) / 30) * 0.3
                else:
                    ndvi_mean = 0.5 - ((days_since_start - 120) / 10) * 0.3
                
                ndvi_mean = max(0.1, min(1.0, ndvi_mean))
                
                data.append({
                    'date': current.strftime('%Y-%m-%d'),
                    'ndvi_mean': round(ndvi_mean, 3),
                    'ndvi_min': round(ndvi_mean - 0.05, 3),
                    'ndvi_max': round(ndvi_mean + 0.05, 3),
                    'ndvi_std': 0.05,
                    'cloud_coverage': 10.0,
                    'image_id': f'SIM_{current.strftime("%Y%m%d")}'
                })
            
            current += timedelta(days=1)
            days_since_start += 1
        
        return data


# Instance globale
gee_service = GoogleEarthEngineService()

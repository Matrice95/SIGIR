"""
Service de Calcul du Soil Moisture Index (SMI)
Combine NDVI, NDWI, pluies, température pour estimer l'humidité du sol
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
import numpy as np


class SoilMoistureService:
    """
    Calcul SMI à partir de données satellites + météo
    """
    
    # Calibration pour riz Côte d'Ivoire (WITA 9, NERICA)
    CALIBRATION = {
        "sol_argilo_limoneux": {
            "theta_sat": 0.45,      # Capacité saturée
            "theta_fc": 0.32,       # Capacité au champ
            "theta_wp": 0.17,       # Point flétrissement
            "theta_afc": 0.15,      # Eau disponible
        },
        "sol_argileux": {
            "theta_sat": 0.50,
            "theta_fc": 0.35,
            "theta_wp": 0.20,
            "theta_afc": 0.15,
        },
        "sol_limoneux": {
            "theta_sat": 0.43,
            "theta_fc": 0.30,
            "theta_wp": 0.15,
            "theta_afc": 0.15,
        },
        "sol_sableux": {
            "theta_sat": 0.38,
            "theta_fc": 0.22,
            "theta_wp": 0.10,
            "theta_afc": 0.12,
        },
        # Seuils NDVI pour détection stress végétation
        "ndvi_thresholds": {
            "stress_severe": (0.0, 0.35),
            "normal": (0.35, 0.55),
            "vigoureux": (0.55, 1.0),
        },
        # Seuils NDMI/NDWI pour humidité
        "ndmi_thresholds": {
            "tres_sec": (-0.3, -0.15),
            "sec": (-0.15, 0.0),
            "normal": (0.0, 0.2),
            "humide": (0.2, 0.5),
        }
    }
    
    @staticmethod
    def calculate_ndwi(nir: float, swir: float) -> float:
        """
        Normalized Difference Water Index (NDWI)
        Mesure humidité de la végétation/sol
        
        Args:
            nir: Bande NIR (B8) de Sentinel-2
            swir: Bande SWIR (B11) de Sentinel-2
        
        Returns:
            NDWI entre -1 et 1 (plus élevé = plus humide)
        """
        if (nir + swir) == 0:
            return 0.0
        return (nir - swir) / (nir + swir)
    
    @staticmethod
    def calculate_smi_multiindex(
        ndvi: float,
        ndwi: float,
        rainfall_7d: float,
        temperature_avg: float,
        soil_type: str = "argilo_limoneux"
    ) -> Dict:
        """
        Calcul SMI combiné 4 indices (RECOMMANDÉ)
        
        Args:
            ndvi: 0-1 (Sentinel-2)
            ndwi: -1 à 1 (Sentinel-2)
            rainfall_7d: mm des 7 derniers jours
            temperature_avg: °C moyenne
            soil_type: Type de sol
        
        Returns:
            Dict avec SMI, classe, composantes, confiance
        """
        
        # 1. NDVI normalisé (santé végétation = indicateur indirect humidité)
        ndvi_norm = max(0, min(1, ndvi))
        ndvi_weight = 0.40
        
        # 2. NDWI normalisé (humidité feuillage/sol directe)
        # Normaliser de [-0.3, 0.5] vers [0, 1]
        ndwi_norm = max(0, min(1, (ndwi + 0.3) / (0.5 + 0.3)))
        ndwi_weight = 0.35
        
        # 3. Pluie normalisée (7 jours)
        # Seuils empiriques Côte d'Ivoire (mm)
        pluie_min, pluie_max = 0, 100
        pluie_norm = max(0, min(1, (rainfall_7d - pluie_min) / (pluie_max - pluie_min)))
        pluie_weight = 0.15
        
        # 4. Température normalisée (inverse: chaleur réduit humidité)
        # Optimale riz: 25-30°C
        temp_optimal_min, temp_optimal_max = 25, 30
        if temp_optimal_min <= temperature_avg <= temp_optimal_max:
            temp_norm = 1.0
        elif temperature_avg < temp_optimal_min:
            # Froid = moins évapotranspiration = plus humide
            temp_norm = 1.0 - (temp_optimal_min - temperature_avg) / 10
        else:
            # Chaud = plus évapotranspiration = moins humide
            temp_norm = 1.0 - (temperature_avg - temp_optimal_max) / 15
        temp_norm = max(0, min(1, temp_norm))
        temp_weight = 0.10
        
        # SMI combiné (0-1)
        smi = (
            ndvi_norm * ndvi_weight +
            ndwi_norm * ndwi_weight +
            pluie_norm * pluie_weight +
            temp_norm * temp_weight
        )
        
        # Déterminer classe SMI
        smi_class = SoilMoistureService._classify_smi(smi)
        
        # Calculer confiance
        confidence = SoilMoistureService._calculate_confidence(
            ndvi, ndwi, rainfall_7d, temperature_avg
        )
        
        return {
            "smi": round(smi, 3),
            "smi_class": smi_class,
            "smi_percent": round(smi * 100, 1),
            "components": {
                "ndvi_contribution": round(ndvi_norm * ndvi_weight, 3),
                "ndwi_contribution": round(ndwi_norm * ndwi_weight, 3),
                "rainfall_contribution": round(pluie_norm * pluie_weight, 3),
                "temperature_contribution": round(temp_norm * temp_weight, 3),
            },
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def calculate_swdi(
        ndvi: float,
        ndwi: float,
        soil_type: str = "argilo_limoneux"
    ) -> Dict:
        """
        Soil Water Deficit Index (approche scientifique)
        
        Args:
            ndvi: NDVI actuel
            ndwi: NDWI actuel
            soil_type: Type de sol
        
        Returns:
            Dict avec SWDI, classe, humidité estimée
        """
        # Récupérer calibration sol
        soil_key = f"sol_{soil_type}"
        if soil_key not in SoilMoistureService.CALIBRATION:
            soil_key = "sol_argilo_limoneux"  # Défaut
        
        calib = SoilMoistureService.CALIBRATION[soil_key]
        
        # Estimer θ (humidité) actuelle via NDVI+NDWI
        # Régression empirique: humidité corrélée avec NDVI et NDWI
        theta_estimated = calib["theta_sat"] * (0.5 * ndvi + 0.5 * max(0, ndwi))
        theta_estimated = max(calib["theta_wp"], min(calib["theta_sat"], theta_estimated))
        
        # SWDI = (θ - θ_FC) / θ_AWC
        swdi = (theta_estimated - calib["theta_fc"]) / calib["theta_afc"]
        
        # Normaliser 0-1 pour compatibilité SMI
        swdi_norm = max(0, min(1, 0.5 + swdi / 2))
        
        # Classifier
        if swdi > 0.3:
            swdi_class = "OPTIMAL"
        elif swdi > 0:
            swdi_class = "ACCEPTABLE"
        elif swdi > -0.3:
            swdi_class = "VIGILANCE"
        else:
            swdi_class = "STRESS_HYDRIQUE"
        
        return {
            "swdi": round(swdi, 3),
            "swdi_norm": round(swdi_norm, 3),
            "swdi_class": swdi_class,
            "theta_estimated": round(theta_estimated, 3),
            "theta_fc": calib["theta_fc"],
            "theta_wp": calib["theta_wp"],
            "water_available_percent": round((theta_estimated - calib["theta_wp"]) / calib["theta_afc"] * 100, 1)
        }
    
    @staticmethod
    def assess_flood_risk(
        smi: float,
        rainfall_forecast_7d: float,
        slope: float,
        drainage_class: str,
        elevation: float
    ) -> Dict:
        """
        Évaluer risque d'inondation basé sur SMI + prévisions pluie + topographie
        
        Args:
            smi: SMI actuel (0-1)
            rainfall_forecast_7d: Pluies prévues 7 jours (mm)
            slope: Pente du terrain (degrés)
            drainage_class: Classe drainage (excellent, good, poor, etc.)
            elevation: Altitude (m)
        
        Returns:
            Dict avec niveau risque, actions recommandées
        """
        risk_score = 0
        warnings = []
        actions = []
        
        # 1. SMI élevé = sol déjà saturé
        if smi > 0.8:
            risk_score += 30
            warnings.append("Sol déjà très humide (SMI={:.1f}%)".format(smi * 100))
        elif smi > 0.6:
            risk_score += 15
        
        # 2. Prévisions pluie importantes
        if rainfall_forecast_7d > 100:
            risk_score += 40
            warnings.append(f"Fortes pluies prévues ({rainfall_forecast_7d}mm)")
        elif rainfall_forecast_7d > 50:
            risk_score += 25
            warnings.append(f"Pluies modérées prévues ({rainfall_forecast_7d}mm)")
        
        # 3. Pente faible = drainage difficile
        if slope < 1:
            risk_score += 20
            warnings.append("Terrain plat: drainage lent")
        elif slope < 2:
            risk_score += 10
        
        # 4. Drainage du sol
        if drainage_class in ["poor", "very-poor", "very_poor"]:
            risk_score += 25
            warnings.append(f"Drainage du sol: {drainage_class}")
        elif drainage_class in ["moderate", "modéré"]:
            risk_score += 10
        
        # 5. Élévation basse
        if elevation < 50:
            risk_score += 15
            warnings.append("Altitude basse: risque accumulation eau")
        
        # Déterminer niveau risque
        if risk_score >= 70:
            risk_level = "CRITIQUE"
            priority = "URGENT"
            actions.extend([
                "🚨 URGENT: Prévoir drainage immédiat",
                "Creuser rigoles d'évacuation",
                "Surveiller niveau d'eau 2x/jour",
                "Ne PAS irriguer",
                "Envisager pompage si nécessaire"
            ])
        elif risk_score >= 50:
            risk_level = "ÉLEVÉ"
            priority = "HAUTE"
            actions.extend([
                "⚠️ Vérifier système drainage",
                "Préparer rigoles d'évacuation",
                "Surveiller niveau d'eau quotidiennement",
                "Suspendre irrigation"
            ])
        elif risk_score >= 30:
            risk_level = "MODÉRÉ"
            priority = "MOYENNE"
            actions.extend([
                "⚠️ Surveiller situation",
                "Vérifier drainage fonctionnel",
                "Réduire irrigation si SMI > 0.7"
            ])
        else:
            risk_level = "FAIBLE"
            priority = "BASSE"
            actions.append("✅ Situation normale, continuer surveillance")
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "priority": priority,
            "warnings": warnings,
            "actions": actions,
            "forecast_smi": round(min(1.0, smi + (rainfall_forecast_7d / 150)), 3),
            "days_until_saturation": SoilMoistureService._estimate_days_to_saturation(
                smi, rainfall_forecast_7d, drainage_class
            )
        }
    
    @staticmethod
    def _estimate_days_to_saturation(
        smi: float,
        rainfall_forecast: float,
        drainage_class: str
    ) -> Optional[int]:
        """Estimer jours avant saturation du sol"""
        if smi >= 0.9:
            return 0
        
        # Capacité restante (mm)
        remaining_capacity = (1.0 - smi) * 100  # Approx 100mm max
        
        # Taux drainage (mm/jour)
        drainage_rates = {
            "excellent": 15,
            "good": 10,
            "moderate": 5,
            "poor": 2,
            "very-poor": 1,
            "very_poor": 1
        }
        drainage_rate = drainage_rates.get(drainage_class, 5)
        
        # Balance hydrique quotidienne
        daily_rain = rainfall_forecast / 7
        net_accumulation = max(0, daily_rain - drainage_rate)
        
        if net_accumulation <= 0:
            return None  # Pas de saturation prévue
        
        days = int(remaining_capacity / net_accumulation)
        return max(1, days)
    
    @staticmethod
    def _classify_smi(smi: float) -> str:
        """Classifier SMI en 5 classes"""
        if smi < 0.2:
            return "TRÈS_SEC"
        elif smi < 0.4:
            return "SEC"
        elif smi < 0.6:
            return "NORMAL"
        elif smi < 0.8:
            return "HUMIDE"
        else:
            return "TRÈS_HUMIDE"
    
    @staticmethod
    def _calculate_confidence(ndvi: float, ndwi: float, rain: float, temp: float) -> int:
        """Score de confiance (0-100%)"""
        penalties = 0
        
        # Vérifier cohérence des données
        if ndvi < 0 or ndvi > 1:
            penalties += 20
        if ndwi < -1 or ndwi > 1:
            penalties += 20
        if rain < 0 or rain > 300:
            penalties += 15
        if temp < 10 or temp > 45:
            penalties += 15
        
        # Pénalité si données trop anciennes (à implémenter avec timestamp)
        
        return max(50, 100 - penalties)


# Instance globale
soil_moisture_service = SoilMoistureService()

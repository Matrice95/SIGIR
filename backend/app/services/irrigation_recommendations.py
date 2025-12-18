"""
Service de Recommandations Intelligentes
Basé sur SMI, stade phénologique, prévisions météo
"""

from datetime import datetime, timedelta
from typing import Dict, List
from app.services.soil_moisture import soil_moisture_service


class IrrigationRecommendationService:
    """
    Recommandations irrigation intelligentes basées SMI
    """
    
    # Seuils SMI critiques par stade phénologique du riz
    PHENOLOGY_THRESHOLDS = {
        "semis": {
            "smi_min": 0.50,
            "smi_optimal": 0.70,
            "priority": "HAUTE",
            "description": "Germination nécessite humidité constante"
        },
        "levée": {
            "smi_min": 0.45,
            "smi_optimal": 0.65,
            "priority": "HAUTE",
            "description": "Établissement racinaire critique"
        },
        "tallage": {
            "smi_min": 0.40,
            "smi_optimal": 0.60,
            "priority": "MOYENNE",
            "description": "Formation des talles"
        },
        "montaison": {
            "smi_min": 0.50,
            "smi_optimal": 0.70,
            "priority": "CRITIQUE",
            "description": "Initiation paniculaire sensible au stress"
        },
        "épiaison": {
            "smi_min": 0.60,
            "smi_optimal": 0.75,
            "priority": "CRITIQUE",
            "description": "Floraison: stade le plus sensible au stress hydrique"
        },
        "maturation": {
            "smi_min": 0.35,
            "smi_optimal": 0.50,
            "priority": "BASSE",
            "description": "Réduire humidité pour favoriser maturité"
        }
    }
    
    @staticmethod
    def generate_recommendation(
        field_id: str,
        smi_data: Dict,
        phenology_stage: str,
        rainfall_forecast_7d: float,
        temperature_forecast_avg: float,
        flood_risk: Dict
    ) -> Dict:
        """
        Générer recommandation irrigation complète
        
        Args:
            field_id: ID parcelle
            smi_data: Données SMI actuelles
            phenology_stage: Stade phénologique
            rainfall_forecast_7d: Pluies prévues (mm)
            temperature_forecast_avg: Température moyenne prévue
            flood_risk: Évaluation risque inondation
        
        Returns:
            Recommandation détaillée avec action, volume, priorité
        """
        smi = smi_data["smi"]
        smi_class = smi_data["smi_class"]
        confidence = smi_data["confidence"]
        
        # Récupérer seuils pour le stade phénologique
        if phenology_stage not in IrrigationRecommendationService.PHENOLOGY_THRESHOLDS:
            phenology_stage = "tallage"  # Défaut
        
        threshold = IrrigationRecommendationService.PHENOLOGY_THRESHOLDS[phenology_stage]
        
        # Projeter SMI avec pluies prévues
        smi_projected = min(1.0, smi + (rainfall_forecast_7d / 150))
        
        # === LOGIQUE DE DÉCISION ===
        
        # PRIORITÉ 1: Risque inondation
        if flood_risk["risk_level"] in ["CRITIQUE", "ÉLEVÉ"]:
            return {
                "action": "NE_PAS_IRRIGUER",
                "priority": "CRITIQUE",
                "volume_mm": 0,
                "reason": f"Risque inondation {flood_risk['risk_level']}",
                "details": flood_risk["warnings"],
                "next_actions": flood_risk["actions"],
                "next_check_hours": 24,
                "confidence": confidence
            }
        
        # PRIORITÉ 2: Sol très sec
        if smi_class == "TRÈS_SEC":
            volume = IrrigationRecommendationService._calculate_irrigation_volume(
                smi, threshold["smi_optimal"], phenology_stage
            )
            return {
                "action": "IRRIGUER_IMMÉDIATEMENT",
                "priority": "URGENTE",
                "volume_mm": volume,
                "reason": f"Sol très sec (SMI={smi:.2f}, besoin>{threshold['smi_min']:.2f})",
                "details": [
                    f"SMI actuel: {smi:.2f} (très sec)",
                    f"SMI requis: >{threshold['smi_min']:.2f} pour {phenology_stage}",
                    f"Stress hydrique sévère détecté",
                    f"Risque perte rendement élevé"
                ],
                "next_actions": [
                    f"Irriguer {volume}mm immédiatement",
                    "Vérifier système irrigation fonctionnel",
                    "Surveiller récupération plants (24-48h)"
                ],
                "next_check_hours": 48,
                "confidence": confidence
            }
        
        # PRIORITÉ 3: Sol sec + stade critique
        if smi_class == "SEC" and smi < threshold["smi_min"]:
            # Vérifier si pluies suffisantes prévues
            if rainfall_forecast_7d > 30 and smi_projected >= threshold["smi_min"]:
                return {
                    "action": "ATTENDRE_PLUIE",
                    "priority": "MOYENNE",
                    "volume_mm": 0,
                    "reason": f"Pluies suffisantes prévues ({rainfall_forecast_7d}mm)",
                    "details": [
                        f"SMI actuel: {smi:.2f}",
                        f"SMI après pluies: ~{smi_projected:.2f}",
                        f"Pluies prévues: {rainfall_forecast_7d}mm",
                        "Économie d'eau possible"
                    ],
                    "next_actions": [
                        "Surveiller prévisions météo",
                        "Préparer irrigation de secours",
                        f"Si pas de pluie sous 48h: irriguer {IrrigationRecommendationService._calculate_irrigation_volume(smi, threshold['smi_optimal'], phenology_stage)}mm"
                    ],
                    "next_check_hours": 48,
                    "confidence": max(70, confidence - 10)
                }
            else:
                volume = IrrigationRecommendationService._calculate_irrigation_volume(
                    smi, threshold["smi_optimal"], phenology_stage
                )
                return {
                    "action": "IRRIGUER_SOUS_48H",
                    "priority": "HAUTE",
                    "volume_mm": volume,
                    "reason": f"SMI={smi:.2f} < seuil critique {threshold['smi_min']:.2f} pour {phenology_stage}",
                    "details": [
                        f"Stade {phenology_stage}: {threshold['description']}",
                        f"SMI actuel: {smi:.2f} (sec)",
                        f"SMI requis: >{threshold['smi_min']:.2f}",
                        f"Pluies insuffisantes prévues: {rainfall_forecast_7d}mm"
                    ],
                    "next_actions": [
                        f"Planifier irrigation de {volume}mm dans 24-48h",
                        "Vérifier disponibilité eau",
                        "Surveiller évolution SMI"
                    ],
                    "next_check_hours": 48,
                    "confidence": confidence
                }
        
        # PRIORITÉ 4: SMI normal
        if smi_class == "NORMAL":
            # Cas particulier: stades critiques nécessitent SMI élevé
            if phenology_stage in ["montaison", "épiaison"] and smi < threshold["smi_optimal"]:
                volume = IrrigationRecommendationService._calculate_irrigation_volume(
                    smi, threshold["smi_optimal"], phenology_stage
                )
                return {
                    "action": "IRRIGATION_LÉGÈRE",
                    "priority": "MOYENNE",
                    "volume_mm": volume,
                    "reason": f"Stade critique {phenology_stage} nécessite SMI optimal",
                    "details": [
                        f"SMI actuel: {smi:.2f} (normal mais insuffisant)",
                        f"SMI optimal: {threshold['smi_optimal']:.2f}",
                        f"{threshold['description']}",
                        "Maintenir humidité élevée recommandé"
                    ],
                    "next_actions": [
                        f"Irrigation légère: {volume}mm",
                        "Surveiller évolution quotidienne"
                    ],
                    "next_check_hours": 72,
                    "confidence": confidence
                }
            else:
                return {
                    "action": "SURVEILLANCE",
                    "priority": "BASSE",
                    "volume_mm": 0,
                    "reason": f"SMI optimal pour {phenology_stage}",
                    "details": [
                        f"SMI actuel: {smi:.2f} (normal)",
                        f"SMI optimal: {threshold['smi_optimal']:.2f}",
                        "Situation hydrique satisfaisante"
                    ],
                    "next_actions": [
                        "Continuer surveillance hebdomadaire",
                        "Pas d'irrigation nécessaire"
                    ],
                    "next_check_hours": 168,  # 7 jours
                    "confidence": confidence
                }
        
        # PRIORITÉ 5: Sol humide
        if smi_class == "HUMIDE":
            return {
                "action": "NE_PAS_IRRIGUER",
                "priority": "BASSE",
                "volume_mm": 0,
                "reason": "Sol suffisamment humide",
                "details": [
                    f"SMI actuel: {smi:.2f} (humide)",
                    "Humidité largement suffisante",
                    "Économie d'eau possible"
                ],
                "next_actions": [
                    "Pas d'irrigation nécessaire",
                    "Surveiller évolution SMI",
                    "Vérifier absence excès d'eau"
                ],
                "next_check_hours": 168,
                "confidence": confidence
            }
        
        # PRIORITÉ 6: Sol très humide (ALERTE)
        if smi_class == "TRÈS_HUMIDE":
            return {
                "action": "RISQUE_ASPHYXIE",
                "priority": "HAUTE",
                "volume_mm": 0,
                "reason": "Excès d'humidité - Risque asphyxie racinaire",
                "details": [
                    f"SMI actuel: {smi:.2f} (très humide)",
                    "Saturation du sol détectée",
                    "Risque pourriture racinaire",
                    "Risque maladies fongiques"
                ],
                "next_actions": [
                    "🚨 NE PAS IRRIGUER",
                    "Vérifier drainage fonctionnel",
                    "Creuser rigoles évacuation si nécessaire",
                    "Surveiller santé plants (jaunissement, flétrissement)",
                    "Envisager traitement fongicide préventif"
                ],
                "next_check_hours": 48,
                "confidence": confidence
            }
        
        # Fallback
        return {
            "action": "SURVEILLANCE",
            "priority": "MOYENNE",
            "volume_mm": 0,
            "reason": "Situation à surveiller",
            "details": [f"SMI: {smi:.2f}"],
            "next_actions": ["Continuer surveillance"],
            "next_check_hours": 72,
            "confidence": max(50, confidence - 20)
        }
    
    @staticmethod
    def _calculate_irrigation_volume(
        smi_current: float,
        smi_target: float,
        phenology_stage: str
    ) -> int:
        """
        Calculer volume irrigation nécessaire
        
        Args:
            smi_current: SMI actuel
            smi_target: SMI cible
            phenology_stage: Stade phénologique
        
        Returns:
            Volume en mm
        """
        # Déficit SMI
        deficit = smi_target - smi_current
        
        if deficit <= 0:
            return 0
        
        # Conversion empirique: 1 point SMI ≈ 80-100mm eau
        # (dépend profondeur racinaire, type sol)
        base_volume = deficit * 90
        
        # Ajustements par stade
        adjustments = {
            "semis": 1.2,          # Plus d'eau pour germination
            "levée": 1.1,
            "tallage": 1.0,
            "montaison": 1.15,     # Stade critique
            "épiaison": 1.2,       # Très critique
            "maturation": 0.8      # Réduire
        }
        
        multiplier = adjustments.get(phenology_stage, 1.0)
        volume = base_volume * multiplier
        
        # Limites pratiques
        volume = max(10, min(80, volume))  # Entre 10 et 80mm
        
        return int(round(volume / 5) * 5)  # Arrondir à 5mm près
    
    @staticmethod
    def get_phenology_stage(planting_date: datetime) -> str:
        """
        Déterminer stade phénologique basé sur jours après plantation
        
        Args:
            planting_date: Date de plantation
        
        Returns:
            Nom du stade phénologique
        """
        days = (datetime.now() - planting_date).days
        
        # Cycle riz pluvial Côte d'Ivoire: ~120 jours
        if days < 10:
            return "semis"
        elif days < 20:
            return "levée"
        elif days < 40:
            return "tallage"
        elif days < 65:
            return "montaison"
        elif days < 90:
            return "épiaison"
        elif days < 120:
            return "maturation"
        else:
            return "récolte"


# Instance globale
irrigation_recommendation_service = IrrigationRecommendationService()

#!/usr/bin/env python3
"""
Script de configuration et test Google Earth Engine
"""

import sys
import os
from pathlib import Path

def check_ee_installed():
    """Vérifier si earthengine-api est installé"""
    try:
        import ee
        print(f"✅ earthengine-api installé (version {ee.__version__})")
        return True
    except ImportError:
        print("❌ earthengine-api non installé")
        print("\nPour installer:")
        print("  pip install earthengine-api")
        return False

def check_credentials():
    """Vérifier si les credentials existent"""
    creds_path = Path(__file__).parent / "credentials" / "gee-private-key.json"
    
    if creds_path.exists():
        print(f"✅ Fichier credentials trouvé: {creds_path}")
        return True
    else:
        print(f"❌ Fichier credentials manquant: {creds_path}")
        print("\nÉtapes:")
        print("1. Créer un service account sur Google Cloud Console")
        print("2. Télécharger la clé JSON")
        print("3. Copier dans: backend/credentials/gee-private-key.json")
        return False

def test_connection():
    """Tester la connexion à GEE"""
    try:
        import ee
        from app.services.gee_service import gee_service
        
        if not gee_service.initialized:
            print("❌ GEE non initialisé")
            return False
        
        print("✅ GEE initialisé avec succès")
        
        # Test simple: récupérer une image
        point = ee.Geometry.Point([-5.0328, 7.6944])  # Bouaké
        image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(point) \
            .filterDate('2025-01-01', '2025-12-31') \
            .first()
        
        info = image.getInfo()
        print(f"✅ Test réussi - Image ID: {info['id']}")
        
        return True
    
    except Exception as e:
        print(f"❌ Erreur test connexion: {e}")
        return False

def test_ndvi_calculation():
    """Tester le calcul NDVI"""
    try:
        from datetime import datetime, timedelta
        from app.services.gee_service import gee_service
        
        # Test sur Bouaké
        lat, lon = 7.6944, -5.0328
        start_date = datetime.now() - timedelta(days=30)
        
        print(f"\n🧪 Test NDVI pour Bouaké ({lat}, {lon})...")
        
        ndvi_data = gee_service.get_sentinel2_ndvi(
            latitude=lat,
            longitude=lon,
            start_date=start_date,
            radius_meters=100
        )
        
        if ndvi_data:
            print(f"✅ Récupéré {len(ndvi_data)} images NDVI")
            
            # Afficher les 3 dernières
            print("\n📊 Dernières données NDVI:")
            for data in ndvi_data[-3:]:
                print(f"  - {data['date']}: NDVI = {data['ndvi_mean']:.3f} " +
                      f"(nuages: {data['cloud_coverage']:.1f}%)")
            
            return True
        else:
            print("⚠️ Aucune donnée NDVI récupérée")
            return False
    
    except Exception as e:
        print(f"❌ Erreur test NDVI: {e}")
        return False

def main():
    """Script principal"""
    print("=" * 60)
    print("🛰️  Configuration Google Earth Engine - SIGIR")
    print("=" * 60)
    print()
    
    # Étape 1: Vérifier installation
    print("📦 Étape 1: Vérification installation...")
    if not check_ee_installed():
        sys.exit(1)
    print()
    
    # Étape 2: Vérifier credentials
    print("🔑 Étape 2: Vérification credentials...")
    if not check_credentials():
        sys.exit(1)
    print()
    
    # Étape 3: Tester connexion
    print("🔌 Étape 3: Test connexion GEE...")
    if not test_connection():
        sys.exit(1)
    print()
    
    # Étape 4: Tester NDVI
    print("🌿 Étape 4: Test calcul NDVI...")
    if not test_ndvi_calculation():
        print("\n⚠️  NDVI test échoué mais GEE fonctionne")
    print()
    
    print("=" * 60)
    print("✅ Configuration Google Earth Engine terminée avec succès!")
    print("=" * 60)
    print()
    print("Vous pouvez maintenant utiliser:")
    print("  - GET /api/weather/ndvi/{field_id}")
    print("  - Données NDVI Sentinel-2 réelles (10m résolution)")
    print()

if __name__ == "__main__":
    main()

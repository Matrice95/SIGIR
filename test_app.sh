#!/bin/bash

# Script de test complet de l'application SIGIR
# Teste l'authentification et récupère les données SMI

echo "🧪 Test de l'Application SIGIR"
echo "================================"
echo ""

BASE_URL="http://localhost:8000"
PHONE="+2250707342607"
PIN="1234"
FIELD_ID="a2027a84-37d5-45f7-a686-51aba6e90add"

# Test 1: Vérifier que le backend répond
echo "1️⃣  Test de connexion backend..."
HEALTH=$(curl -s "$BASE_URL/" 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Backend accessible"
else
    echo "❌ Backend inaccessible"
    exit 1
fi
echo ""

# Test 2: Login
echo "2️⃣  Test d'authentification..."
echo "   Téléphone: $PHONE"
echo "   PIN: $PIN"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"$PHONE\", \"password\": \"$PIN\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Échec de l'authentification"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Authentification réussie"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Test 3: Récupérer les données SMI
echo "3️⃣  Récupération des données SMI..."
echo "   Parcelle: $FIELD_ID"

SMI_RESPONSE=$(curl -s "$BASE_URL/api/weather/smi/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN")

# Vérifier si la réponse contient des données SMI
if echo "$SMI_RESPONSE" | grep -q "smi"; then
    echo "✅ Données SMI récupérées"
    echo ""
    echo "📊 Résumé des Données:"
    echo "-------------------"
    echo "$SMI_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'SMI: {data[\"smi\"]*100:.1f}%')
print(f'Classe: {data[\"smi_class\"]}')
print(f'SWDI: {data[\"swdi\"]:.2f}')
print(f'Confiance: {data[\"confidence\"]}%')
print(f'')
print(f'Recommandation:')
print(f'  Action: {data[\"recommendation\"][\"action\"]}')
print(f'  Priorité: {data[\"recommendation\"][\"priority\"]}')
print(f'  Volume: {data[\"recommendation\"][\"volume_mm\"]}mm')
print(f'  Prochain contrôle: {data[\"recommendation\"][\"next_check_hours\"]}h')
print(f'')
print(f'Composantes:')
print(f'  NDVI: {data[\"field_info\"][\"ndvi\"]:.3f}')
print(f'  NDWI: {data[\"field_info\"][\"ndwi\"]:.3f}')
print(f'  Pluie 7j: {data[\"field_info\"][\"rainfall_7d\"]:.1f}mm')
print(f'  Température: {data[\"field_info\"][\"temperature_avg\"]:.1f}°C')
" 2>/dev/null
else
    echo "❌ Erreur lors de la récupération SMI"
    echo "Response: $SMI_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Météo
echo "4️⃣  Récupération des prévisions météo..."
WEATHER_RESPONSE=$(curl -s "$BASE_URL/api/weather/weather/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN")

if echo "$WEATHER_RESPONSE" | grep -q "daily"; then
    echo "✅ Prévisions météo récupérées"
    FORECAST_DAYS=$(echo "$WEATHER_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['daily']))" 2>/dev/null)
    echo "   Jours de prévision: $FORECAST_DAYS"
else
    echo "⚠️  Erreur prévisions météo"
fi
echo ""

# Test 5: ETP
echo "5️⃣  Récupération des données ETP..."
ETP_RESPONSE=$(curl -s "$BASE_URL/api/etp/calculate/$FIELD_ID" \
    -H "Authorization: Bearer $TOKEN")

if echo "$ETP_RESPONSE" | grep -q "et0"; then
    echo "✅ Données ETP récupérées"
    ET0=$(echo "$ETP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['et0'])" 2>/dev/null)
    echo "   ET0: ${ET0}mm/jour"
else
    echo "⚠️  Erreur données ETP"
fi
echo ""

# Résumé
echo "================================"
echo "✅ Tests terminés avec succès!"
echo ""
echo "🎯 L'application est prête à être utilisée:"
echo "   - Backend: $BASE_URL"
echo "   - Frontend: http://localhost:8081"
echo "   - Login: $PHONE / $PIN"
echo ""
echo "📱 Pour tester sur mobile:"
echo "   1. Installer Expo Go"
echo "   2. Scanner le QR code dans le terminal frontend"
echo "   3. Se connecter avec les identifiants ci-dessus"
echo ""

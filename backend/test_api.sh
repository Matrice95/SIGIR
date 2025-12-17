#!/bin/bash
# Test script for SIGIR API

BASE_URL="http://localhost:8000"
TOKEN=""

echo "========================================="
echo "SIGIR API Test Suite"
echo "========================================="
echo ""

# 1. Test root endpoint
echo "1. Testing root endpoint..."
curl -s $BASE_URL/ | python -m json.tool
echo ""

# 2. Register a new user
echo "2. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2250777888999", "name": "Demo User", "password": "demo1234"}')
echo $REGISTER_RESPONSE | python -m json.tool
TOKEN=$(echo $REGISTER_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
echo ""

# 3. Login
echo "3. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2250777888999", "password": "demo1234"}')
echo $LOGIN_RESPONSE | python -m json.tool
TOKEN=$(echo $LOGIN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Exiting."
    exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:50}..."
echo ""

# 4. Get current user
echo "4. Getting current user info..."
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/auth/me | python -m json.tool
echo ""

# 5. Create a field
echo "5. Creating a field..."
FIELD_RESPONSE=$(curl -s -X POST $BASE_URL/api/fields/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Parcelle Nord",
    "area": 3.5,
    "crop_type": "Riz",
    "variety": "NERICA 4",
    "soil_type": "Argileux",
    "planting_date": "2025-11-01T00:00:00",
    "latitude": 5.3599,
    "longitude": -4.0083
  }')
echo $FIELD_RESPONSE | python -m json.tool
FIELD_ID=$(echo $FIELD_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo ""

# 6. List fields
echo "6. Listing all fields..."
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/fields/ | python -m json.tool
echo ""

# 7. Create an irrigation operation
echo "7. Creating an irrigation operation..."
curl -s -X POST $BASE_URL/api/operations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"irrigation\",
    \"date\": \"2025-12-17T08:00:00\",
    \"field_id\": \"$FIELD_ID\",
    \"water_amount\": 60,
    \"irrigation_method\": \"Aspersion\",
    \"duration\": 2.5,
    \"notes\": \"Irrigation matinale - test\"
  }" | python -m json.tool
echo ""

# 8. Create a fertilization operation
echo "8. Creating a fertilization operation..."
curl -s -X POST $BASE_URL/api/operations/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"fertilization\",
    \"date\": \"2025-12-15T10:00:00\",
    \"field_id\": \"$FIELD_ID\",
    \"fertilizer_type\": \"NPK\",
    \"fertilizer_quantity\": 150,
    \"npk_ratio\": \"15-15-15\",
    \"notes\": \"Application d'engrais NPK\"
  }" | python -m json.tool
echo ""

# 9. List operations
echo "9. Listing all operations..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/operations/?field_id=$FIELD_ID" | python -m json.tool
echo ""

# 10. Create alerts
echo "10. Creating alerts..."
curl -s -X POST $BASE_URL/api/alerts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$(echo $LOGIN_RESPONSE | python -c 'import sys, json; print(json.load(sys.stdin)[\"user\"][\"id\"])')\",
    \"type\": \"irrigation\",
    \"title\": \"Irrigation recommandée\",
    \"message\": \"Il est temps d'irriguer la parcelle Nord\",
    \"priority\": \"high\"
  }" | python -m json.tool
echo ""

# 11. List alerts
echo "11. Listing alerts..."
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/alerts/ | python -m json.tool
echo ""

echo "========================================="
echo "✅ All tests completed!"
echo "========================================="
echo ""
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔄 ReDoc: http://localhost:8000/redoc"

"""
SIGIR - Système d'Information pour la Gestion de l'Irrigation du Riz
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, users, fields, operations, weather, alerts, etp

app = FastAPI(
    title="SIGIR API",
    description="API pour la gestion de l'irrigation du riz en Côte d'Ivoire",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(fields.router, prefix="/api/fields", tags=["Fields"])
app.include_router(operations.router, prefix="/api/operations", tags=["Operations"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(etp.router, prefix="/api/etp", tags=["Evapotranspiration"])

@app.get("/")
async def root():
    return {
        "message": "SIGIR API - Système d'Information pour la Gestion de l'Irrigation",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

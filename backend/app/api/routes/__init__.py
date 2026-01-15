"""
API Routes - Combined router for all endpoints
"""

from fastapi import APIRouter

from app.api.routes import auth, credit, fuel, balance, dashboard

router = APIRouter()

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(credit.router, prefix="/credit", tags=["Credit"])
router.include_router(fuel.router, prefix="/fuel", tags=["Fuel"])
router.include_router(balance.router, prefix="/balance", tags=["Balance"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

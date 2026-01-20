"""
API Routes
Combines all route modules into a single router
"""

from fastapi import APIRouter

from app.api.routes import auth, credit, companies

# Create main router
router = APIRouter()

# Include all sub-routers
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(credit.router, prefix="/credit", tags=["credit"])
router.include_router(companies.router, prefix="/companies", tags=["companies"])

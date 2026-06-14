from fastapi import APIRouter

from app.configuration.router import router as config_router
from app.identity.router import router as auth_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(config_router, tags=["configuration"])

from fastapi import APIRouter

from app.audit.router import router as audit_router
from app.configuration.router import router as config_router
from app.identity.router import router as auth_router
from app.waitlist.router import router as waitlist_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(config_router, tags=["configuration"])
api_router.include_router(audit_router, tags=["audit"])
api_router.include_router(waitlist_router, tags=["waitlist"])

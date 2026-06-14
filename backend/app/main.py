from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib import import_module

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.middleware import CorrelationIdMiddleware
from app.shared.exceptions import CBOSException, ForbiddenError, NotFoundError, UnauthorizedError
from app.shared.responses import ErrorAPIResponse, ErrorDetail

logger = structlog.get_logger()


def _register_models() -> None:
    for module_name in (
        "app.organizations.models",
        "app.identity.models",
        "app.rbac.models",
        "app.configuration.models",
        "app.audit.models",
        "app.events.models",
    ):
        import_module(module_name)


_register_models()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:  # type: ignore[type-arg]
    configure_logging()
    logger.info("CBOS backend starting", version=settings.app_version)
    yield
    logger.info("CBOS backend shutting down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url=f"{settings.api_v1_prefix}/docs",
    redoc_url=f"{settings.api_v1_prefix}/redoc",
    lifespan=lifespan,
)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorAPIResponse(errors=[ErrorDetail(code=code, message=message)]).model_dump(
            mode="json"
        ),
    )


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _error_response(404, exc.code, exc.message)


@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
    return _error_response(401, exc.code, exc.message)


@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return _error_response(403, exc.code, exc.message)


@app.exception_handler(CBOSException)
async def cbos_exception_handler(request: Request, exc: CBOSException) -> JSONResponse:
    return _error_response(400, exc.code, exc.message)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": settings.app_version}

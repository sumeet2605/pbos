import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class APIResponse(BaseModel):
    success: bool = True
    data: Any | None = None
    meta: dict[str, Any] | None = None
    errors: list[ErrorDetail] | None = None
    correlation_id: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    next_cursor: str | None = None
    has_more: bool = False


def ok(data: Any, meta: dict[str, Any] | None = None) -> APIResponse:
    return APIResponse(success=True, data=data, meta=meta)


def paginated(
    data: list[Any],
    total: int,
    page: int,
    page_size: int,
    next_cursor: str | None = None,
) -> APIResponse:
    return APIResponse(
        success=True,
        data=data,
        meta=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            next_cursor=next_cursor,
            has_more=next_cursor is not None,
        ).model_dump(),
    )


def error(
    code: str,
    message: str,
    status_code: int = 400,
    correlation_id: str | None = None,
) -> APIResponse:
    return APIResponse(
        success=False,
        errors=[ErrorDetail(code=code, message=message)],
        correlation_id=correlation_id,
    )

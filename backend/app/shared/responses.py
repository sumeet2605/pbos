import uuid
from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    next_cursor: str | None = None
    has_more: bool = False


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    meta: dict[str, Any] | None = None
    errors: list[ErrorDetail] | None = None
    correlation_id: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class PaginatedAPIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T] = Field(default_factory=list)
    meta: PaginationMeta
    errors: list[ErrorDetail] | None = None
    correlation_id: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DeleteResponse(BaseModel):
    id: uuid.UUID
    deleted: bool = True


class ErrorAPIResponse(BaseModel):
    success: bool = False
    data: None = None
    meta: dict[str, Any] | None = None
    errors: list[ErrorDetail]
    correlation_id: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


def ok(data: T, meta: dict[str, Any] | None = None) -> APIResponse[T]:
    return APIResponse[T](success=True, data=data, meta=meta)


def paginated(
    data: list[T],
    total: int,
    page: int,
    page_size: int,
    next_cursor: str | None = None,
) -> PaginatedAPIResponse[T]:
    return PaginatedAPIResponse[T](
        success=True,
        data=data,
        meta=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            next_cursor=next_cursor,
            has_more=next_cursor is not None,
        ),
    )


def error(
    code: str,
    message: str,
    correlation_id: str | None = None,
) -> ErrorAPIResponse:
    return ErrorAPIResponse(
        success=False,
        errors=[ErrorDetail(code=code, message=message)],
        correlation_id=correlation_id,
    )

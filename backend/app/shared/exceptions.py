class CBOSException(Exception):  # noqa: N818
    def __init__(self, message: str, code: str = "INTERNAL_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(CBOSException):
    def __init__(self, resource: str, id: str) -> None:
        super().__init__(
            message=f"{resource} with id '{id}' not found.",
            code="NOT_FOUND",
        )


class UnauthorizedError(CBOSException):
    def __init__(self, message: str = "Unauthorized.") -> None:
        super().__init__(message=message, code="UNAUTHORIZED")


class ForbiddenError(CBOSException):
    def __init__(self, message: str = "Access denied.") -> None:
        super().__init__(message=message, code="FORBIDDEN")


class ConflictError(CBOSException):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code="CONFLICT")


class ValidationError(CBOSException):
    def __init__(self, message: str) -> None:
        super().__init__(message=message, code="VALIDATION_ERROR")

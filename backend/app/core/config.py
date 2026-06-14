from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "change-me-in-production"  # noqa: S105


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "CBOS Platform"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"

    # API
    api_v1_prefix: str = "/api/v1"
    allowed_hosts: list[str] = ["*"]
    cors_origins: list[str] = ["http://localhost:5173"]

    # Database
    database_url: str = "postgresql+asyncpg://" "postgres:postgres@localhost:5432/cbos"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = _DEFAULT_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    @model_validator(mode="after")
    def _validate_secret_key(self) -> "Settings":
        if self.environment not in ("development", "test") and self.secret_key == _DEFAULT_SECRET:
            msg = (
                "SECRET_KEY must be changed from the default value before running in "
                f"'{self.environment}' environment."
            )
            raise ValueError(msg)
        return self


settings = Settings()

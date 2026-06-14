"""Unit tests - secret key validation.

Regression tests for P1 finding: the default secret key
"change-me-in-production" was allowed in any environment with no guard.
"""

import os

import pytest


def _make_settings(**overrides: str) -> object:
    """Create a fresh Settings instance with the given env vars."""
    from importlib import reload

    env_backup = os.environ.copy()
    for key, val in overrides.items():
        os.environ[key] = val

    try:
        # Force a fresh import so the module-level settings = Settings() re-runs
        import app.core.config as cfg_module

        reload(cfg_module)
        return cfg_module.Settings(**{k.lower(): v for k, v in overrides.items()})
    finally:
        # Restore environment
        os.environ.clear()
        os.environ.update(env_backup)


def test_default_secret_key_allowed_in_development() -> None:
    """The default secret must be acceptable in 'development' environment."""
    from app.core.config import Settings

    s = Settings(environment="development", secret_key="change-me-in-production")
    assert s.secret_key == "change-me-in-production"


def test_default_secret_key_allowed_in_test() -> None:
    """The default secret must be acceptable in 'test' environment."""
    from app.core.config import Settings

    s = Settings(environment="test", secret_key="change-me-in-production")
    assert s.secret_key == "change-me-in-production"


def test_default_secret_key_rejected_in_production() -> None:
    """Settings must raise when secret_key is the default value in production."""
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises((ValueError, ValidationError)):
        Settings(environment="production", secret_key="change-me-in-production")


def test_default_secret_key_rejected_in_staging() -> None:
    """Settings must raise for any non-dev/test environment with default key."""
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises((ValueError, ValidationError)):
        Settings(environment="staging", secret_key="change-me-in-production")


def test_custom_secret_key_allowed_in_production() -> None:
    """A non-default key must be accepted in production."""
    from app.core.config import Settings

    s = Settings(environment="production", secret_key="super-secret-key-32-bytes-long!!")
    assert s.secret_key == "super-secret-key-32-bytes-long!!"

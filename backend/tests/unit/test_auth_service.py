import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.identity.schemas import TokenResponse
from app.identity.service import AuthService
from app.shared.exceptions import UnauthorizedError


@pytest.mark.asyncio
async def test_login_success(monkeypatch: pytest.MonkeyPatch) -> None:
    db = object()
    redis = object()
    org = SimpleNamespace(id=uuid.uuid4(), slug="acme", is_active=True)
    user = SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=org.id,
        hashed_password="hashed",
        is_active=True,
    )
    org_repo = AsyncMock()
    org_repo.get_by_slug.return_value = org
    user_repo = AsyncMock()
    user_repo.get_by_email_and_org.return_value = user
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None
    token_store = AsyncMock()
    token_store.save.return_value = None

    monkeypatch.setattr("app.identity.service.OrganizationRepository", lambda session: org_repo)
    monkeypatch.setattr("app.identity.service.UserRepository", lambda session: user_repo)
    monkeypatch.setattr("app.identity.service.AuditEventRepository", lambda session: audit_repo)
    monkeypatch.setattr("app.identity.service.RefreshTokenStore", lambda r: token_store)
    monkeypatch.setattr("app.identity.service.verify_password", lambda plain, hashed: True)
    monkeypatch.setattr(
        "app.identity.service.create_access_token", lambda subject, organization_id: "access"
    )
    monkeypatch.setattr(
        "app.identity.service.create_refresh_token",
        lambda subject, organization_id: ("refresh", "jti-1"),
    )

    result = await AuthService.login(db, "user@example.com", "secret", "acme", redis)

    assert result == TokenResponse(access_token="access", refresh_token="refresh")
    org_repo.get_by_slug.assert_awaited_once_with("acme")
    user_repo.get_by_email_and_org.assert_awaited_once_with("user@example.com", org.id)
    audit_repo.create_event.assert_awaited_once()
    token_store.save.assert_awaited_once_with("jti-1", user.id)


@pytest.mark.asyncio
async def test_login_wrong_password(monkeypatch: pytest.MonkeyPatch) -> None:
    db = object()
    redis = object()
    org = SimpleNamespace(id=uuid.uuid4(), slug="acme", is_active=True)
    user = SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=org.id,
        hashed_password="hashed",
        is_active=True,
    )
    org_repo = AsyncMock()
    org_repo.get_by_slug.return_value = org
    user_repo = AsyncMock()
    user_repo.get_by_email_and_org.return_value = user

    monkeypatch.setattr("app.identity.service.OrganizationRepository", lambda session: org_repo)
    monkeypatch.setattr("app.identity.service.UserRepository", lambda session: user_repo)
    monkeypatch.setattr("app.identity.service.verify_password", lambda plain, hashed: False)

    with pytest.raises(UnauthorizedError):
        await AuthService.login(db, "user@example.com", "bad-password", "acme", redis)


@pytest.mark.asyncio
async def test_login_user_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    db = object()
    redis = object()
    org = SimpleNamespace(id=uuid.uuid4(), slug="acme", is_active=True)
    org_repo = AsyncMock()
    org_repo.get_by_slug.return_value = org
    user_repo = AsyncMock()
    user_repo.get_by_email_and_org.return_value = None

    monkeypatch.setattr("app.identity.service.OrganizationRepository", lambda session: org_repo)
    monkeypatch.setattr("app.identity.service.UserRepository", lambda session: user_repo)

    with pytest.raises(UnauthorizedError):
        await AuthService.login(db, "missing@example.com", "secret", "acme", redis)


@pytest.mark.asyncio
async def test_refresh_success(monkeypatch: pytest.MonkeyPatch) -> None:
    db = object()
    redis = object()
    organization_id = uuid.uuid4()
    user = SimpleNamespace(id=uuid.uuid4(), organization_id=organization_id, is_active=True)
    user_repo = AsyncMock()
    user_repo.get_by_id.return_value = user
    token_store = AsyncMock()
    token_store.exists.return_value = True
    token_store.revoke.return_value = None
    token_store.save.return_value = None

    monkeypatch.setattr(
        "app.identity.service.decode_token",
        lambda token: {
            "sub": str(user.id),
            "org": str(organization_id),
            "type": "refresh",
            "jti": "old-jti",
        },
    )
    monkeypatch.setattr("app.identity.service.UserRepository", lambda session: user_repo)
    monkeypatch.setattr("app.identity.service.RefreshTokenStore", lambda r: token_store)
    monkeypatch.setattr(
        "app.identity.service.create_access_token", lambda subject, org_id: "new-access"
    )
    monkeypatch.setattr(
        "app.identity.service.create_refresh_token",
        lambda subject, org_id: ("new-refresh", "new-jti"),
    )

    result = await AuthService.refresh(db, "refresh-token", redis)

    assert result == TokenResponse(access_token="new-access", refresh_token="new-refresh")
    user_repo.get_by_id.assert_awaited_once_with(user.id)
    token_store.revoke.assert_awaited_once_with("old-jti")
    token_store.save.assert_awaited_once_with("new-jti", user.id)


@pytest.mark.asyncio
async def test_refresh_revoked_token(monkeypatch: pytest.MonkeyPatch) -> None:
    redis = object()
    token_store = AsyncMock()
    token_store.exists.return_value = False

    monkeypatch.setattr(
        "app.identity.service.decode_token",
        lambda token: {
            "sub": str(uuid.uuid4()),
            "org": str(uuid.uuid4()),
            "type": "refresh",
            "jti": "revoked-jti",
        },
    )
    monkeypatch.setattr("app.identity.service.RefreshTokenStore", lambda r: token_store)

    with pytest.raises(UnauthorizedError):
        await AuthService.refresh(object(), "revoked-token", redis)


@pytest.mark.asyncio
async def test_refresh_invalid_token_type(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.identity.service.decode_token",
        lambda token: {
            "sub": str(uuid.uuid4()),
            "org": str(uuid.uuid4()),
            "type": "access",
            "jti": "some-jti",
        },
    )

    with pytest.raises(UnauthorizedError):
        await AuthService.refresh(object(), "not-a-refresh-token", object())


@pytest.mark.asyncio
async def test_logout_revokes_jti(monkeypatch: pytest.MonkeyPatch) -> None:
    redis = object()
    token_store = AsyncMock()
    token_store.revoke.return_value = None

    monkeypatch.setattr(
        "app.identity.service.decode_token",
        lambda token: {
            "sub": str(uuid.uuid4()),
            "org": str(uuid.uuid4()),
            "type": "refresh",
            "jti": "logout-jti",
        },
    )
    monkeypatch.setattr("app.identity.service.RefreshTokenStore", lambda r: token_store)

    await AuthService.logout("some-refresh-token", redis)

    token_store.revoke.assert_awaited_once_with("logout-jti")

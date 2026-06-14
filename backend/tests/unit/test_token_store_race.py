"""Unit tests - refresh token race-condition fix.

Regression tests for P1 finding: the refresh flow used two separate Redis
calls (exists -> revoke) which allowed a race between concurrent requests.
The fix replaces these with a single atomic GETDEL via consume().
"""

import uuid

import fakeredis.aioredis
import pytest
import pytest_asyncio

from app.core.token_store import RefreshTokenStore


@pytest_asyncio.fixture
async def store() -> RefreshTokenStore:
    async with fakeredis.aioredis.FakeRedis() as redis:
        yield RefreshTokenStore(redis)


@pytest.mark.asyncio
async def test_consume_returns_true_and_removes_key(store: RefreshTokenStore) -> None:
    """consume() must return True on first call and delete the key atomically."""
    jti = str(uuid.uuid4())
    await store.save(jti, uuid.uuid4())

    result = await store.consume(jti)

    assert result is True
    # Key must be gone; a second consume must return False
    second = await store.consume(jti)
    assert second is False


@pytest.mark.asyncio
async def test_consume_returns_false_for_absent_key(store: RefreshTokenStore) -> None:
    jti = str(uuid.uuid4())
    result = await store.consume(jti)
    assert result is False


@pytest.mark.asyncio
async def test_consume_is_idempotent(store: RefreshTokenStore) -> None:
    """Calling consume() twice on the same JTI must yield True then False."""
    jti = str(uuid.uuid4())
    await store.save(jti, uuid.uuid4())

    first = await store.consume(jti)
    second = await store.consume(jti)

    assert first is True
    assert second is False


@pytest.mark.asyncio
async def test_concurrent_consumes_only_one_wins(store: RefreshTokenStore) -> None:
    """Simulate two concurrent refreshes: exactly one must succeed."""
    import asyncio

    jti = str(uuid.uuid4())
    await store.save(jti, uuid.uuid4())

    results = await asyncio.gather(store.consume(jti), store.consume(jti))

    # One must be True and the other False
    assert sorted(results) == [False, True]


@pytest.mark.asyncio
async def test_exists_still_works(store: RefreshTokenStore) -> None:
    """exists() helper (used in other paths) still works correctly."""
    jti = str(uuid.uuid4())
    await store.save(jti, uuid.uuid4())
    assert await store.exists(jti) is True

    await store.revoke(jti)
    assert await store.exists(jti) is False

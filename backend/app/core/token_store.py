"""Redis-backed refresh token store for revocation and single-use enforcement."""

import uuid
from datetime import timedelta

import redis.asyncio as aioredis

_REFRESH_TTL_DAYS = 30


class RefreshTokenStore:
    """Store and revoke refresh token JTIs in Redis."""

    def __init__(self, redis: aioredis.Redis) -> None:
        self._redis = redis

    def _key(self, jti: str) -> str:
        return f"refresh:{jti}"

    async def save(self, jti: str, user_id: uuid.UUID) -> None:
        """Persist a new refresh token JTI with the associated user ID."""
        ttl = timedelta(days=_REFRESH_TTL_DAYS)
        await self._redis.set(self._key(jti), str(user_id), ex=int(ttl.total_seconds()))

    async def exists(self, jti: str) -> bool:
        """Return True when the JTI is still valid (not revoked or expired)."""
        value = await self._redis.get(self._key(jti))
        return value is not None

    async def revoke(self, jti: str) -> None:
        """Remove the JTI so subsequent refresh attempts are rejected."""
        await self._redis.delete(self._key(jti))

"""
KrishiConnect Redis Client & Cache Manager
Provides async Redis connection pooling, JSON serialization,
Pub/Sub event transport, and transparent graceful fallback.
"""
import os
import json
import logging
from typing import Any, Optional, Union, List
import redis.asyncio as aioredis

logger = logging.getLogger("krishiconnect.redis")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class RedisManager:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self._is_connected: bool = False
        self._logged_offline_warning: bool = False

    async def init(self):
        """Initialize connection pool to Redis."""
        try:
            self.redis = aioredis.from_url(
                REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            # Test ping
            await self.redis.ping()
            self._is_connected = True
            self._logged_offline_warning = False
            logger.info("✅ Connected to Redis at %s", REDIS_URL)
        except Exception as e:
            self._is_connected = False
            if not self._logged_offline_warning:
                logger.info("ℹ️ Redis not reachable at %s (%s). Running in memory-fallback mode.", REDIS_URL, e)
                self._logged_offline_warning = True

    async def close(self):
        """Close connection pool."""
        if self.redis:
            try:
                await self.redis.close()
            except Exception:
                pass
            self._is_connected = False
            logger.info("Redis connection closed.")

    @property
    def is_available(self) -> bool:
        return self._is_connected and self.redis is not None

    async def get(self, key: str) -> Optional[str]:
        """Fetch raw string from Redis."""
        if not self.is_available:
            return None
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.debug("Redis GET error for key %s: %s", key, e)
            return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set raw string in Redis with optional TTL."""
        if not self.is_available:
            return False
        try:
            if ex:
                await self.redis.setex(key, ex, value)
            else:
                await self.redis.set(key, value)
            return True
        except Exception as e:
            logger.debug("Redis SET error for key %s: %s", key, e)
            return False

    async def setex(self, key: str, time_seconds: int, value: str) -> bool:
        """Set raw string with expiration."""
        return await self.set(key, value, ex=time_seconds)

    async def get_json(self, key: str) -> Optional[Any]:
        """Fetch and deserialize JSON object from Redis."""
        if not self.is_available:
            return None
        try:
            data = await self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.debug("Redis get_json error for key %s: %s", key, e)
            return None

    async def set_json(self, key: str, value: Any, expire_seconds: Optional[int] = None) -> bool:
        """Serialize and store JSON object in Redis with optional TTL."""
        if not self.is_available:
            return False
        try:
            serialized = json.dumps(value, default=str)
            if expire_seconds:
                await self.redis.setex(key, expire_seconds, serialized)
            else:
                await self.redis.set(key, serialized)
            return True
        except Exception as e:
            logger.debug("Redis set_json error for key %s: %s", key, e)
            return False

    async def incr(self, key: str) -> int:
        """Increment integer key (used for rate limiting)."""
        if not self.is_available:
            return 1
        try:
            return await self.redis.incr(key)
        except Exception as e:
            logger.debug("Redis INCR error for %s: %s", key, e)
            return 1

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration time on a key."""
        if not self.is_available:
            return False
        try:
            return bool(await self.redis.expire(key, seconds))
        except Exception as e:
            logger.debug("Redis EXPIRE error for %s: %s", key, e)
            return False

    async def ttl(self, key: str) -> int:
        """Get remaining TTL on a key in seconds."""
        if not self.is_available:
            return -1
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            logger.debug("Redis TTL error for %s: %s", key, e)
            return -1

    async def delete(self, *keys: str) -> int:
        """Delete one or more keys from Redis."""
        if not self.is_available or not keys:
            return 0
        try:
            return await self.redis.delete(*keys)
        except Exception as e:
            logger.debug("Redis DELETE error: %s", e)
            return 0

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern (e.g. 'ai:recommend:*')."""
        if not self.is_available:
            return 0
        try:
            count = 0
            keys_to_del = []
            async for key in self.redis.scan_iter(match=pattern, count=100):
                keys_to_del.append(key)
                if len(keys_to_del) >= 100:
                    await self.redis.delete(*keys_to_del)
                    count += len(keys_to_del)
                    keys_to_del = []
            if keys_to_del:
                await self.redis.delete(*keys_to_del)
                count += len(keys_to_del)
            return count
        except Exception as e:
            logger.debug("Redis delete_pattern error for %s: %s", pattern, e)
            return 0

    async def publish(self, channel: str, message: Union[str, dict]):
        """Publish event message to Redis Pub/Sub channel."""
        if not self.is_available:
            return
        try:
            payload = json.dumps(message, default=str) if isinstance(message, dict) else str(message)
            await self.redis.publish(channel, payload)
        except Exception as e:
            logger.debug("Redis PUBLISH error on channel %s: %s", channel, e)


redis_manager = RedisManager()

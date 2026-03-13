from __future__ import annotations

import threading
import time

from app.core.config import get_settings

try:
    from redis import Redis
except Exception:  # pragma: no cover
    Redis = None  # type: ignore


class ReplayStore:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._lock = threading.Lock()
        self._memory: dict[str, float] = {}
        self._client = None
        if Redis is not None:
            try:
                self._client = Redis.from_url(self._settings.redis_url, decode_responses=True)
                self._client.ping()
            except Exception:
                self._client = None

    def consume_once(self, key: str, ttl_seconds: int) -> bool:
        return self.set_once(key, ttl_seconds)

    def exists(self, key: str) -> bool:
        if self._client is not None:
            try:
                return bool(self._client.exists(key))
            except Exception:
                pass
        return self._exists_memory(key)

    def set_once(self, key: str, ttl_seconds: int) -> bool:
        ttl = max(1, int(ttl_seconds))
        if self._client is not None:
            try:
                return bool(self._client.set(key, '1', nx=True, ex=ttl))
            except Exception:
                pass
        return self._set_once_memory(key, ttl)

    def _exists_memory(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            expired_keys = [k for k, exp in self._memory.items() if exp <= now]
            for k in expired_keys:
                del self._memory[k]
            return key in self._memory

    def _set_once_memory(self, key: str, ttl_seconds: int) -> bool:
        now = time.time()
        with self._lock:
            expired_keys = [k for k, exp in self._memory.items() if exp <= now]
            for k in expired_keys:
                del self._memory[k]

            if key in self._memory:
                return False

            self._memory[key] = now + ttl_seconds
            return True

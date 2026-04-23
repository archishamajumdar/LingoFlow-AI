from typing import Any, Optional
import json

class CacheManager:
    def __init__(self):
        self._memory_cache = {}
        # Place to initialize Redis later using settings.REDIS_URL
        
    async def get(self, key: str) -> Optional[Any]:
        return self._memory_cache.get(key)
        
    async def set(self, key: str, value: Any, expire: int = 3600):
        self._memory_cache[key] = value

cache_manager = CacheManager()

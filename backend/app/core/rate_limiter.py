import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Request, status

class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            cutoff = now - self.window_seconds
            # Filter out timestamps older than the sliding window
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]
            if len(self.requests[key]) >= self.max_requests:
                return False
            self.requests[key].append(now)
            return True

    def __call__(self, request: Request):
        # Extract IP from client or forwarded header
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        # For localhost / dev environment, allow high throughput to avoid false positive lockouts
        if client_ip in ("127.0.0.1", "localhost", "::1", "testclient"):
            return
        
        endpoint_key = f"{client_ip}:{request.url.path}"
        if not self.check(endpoint_key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many attempts. Please wait {self.window_seconds} seconds before trying again."
            )

auth_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=60)
reset_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)

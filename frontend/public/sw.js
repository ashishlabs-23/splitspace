const CACHE_NAME = "splitspace-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg"
];

// Install event: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for API, Cache-first / Stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser-extension schemes
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // API calls: Network first with graceful offline fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: "Offline mode: network unavailable." }),
            { headers: { "Content-Type": "application/json" }, status: 503 }
          );
        });
      })
    );
    return;
  }

  // Static assets & navigation: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return cached;
      });

      return cached || fetchPromise;
    })
  );
});

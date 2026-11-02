// Offline-Modus für den Cardboard VR-Player
// Beim ersten Aufruf mit Internet werden alle Dateien auf dem Gerät gespeichert.
// Danach startet der Player auch im Flugmodus.
// Bei einer neuen Version: CACHE-Nummer erhöhen (z. B. 'vr-player-v2').
const CACHE = 'vr-player-v2';
const FILES = [
  './',
  './index.html',
  './datenschutz.html',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Zuerst die gespeicherte Version liefern; wenn Internet da ist, im Hintergrund aktualisieren.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      const res = await network;
      return res || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});

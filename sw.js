/* Gefahren-Feldbuch · Service Worker */
const VERSION = 'v1.1.0';
const CORE = 'gf-core-' + VERSION;
const TILES = 'gf-tiles-' + VERSION;
const TILE_CAP = 1600;

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

const TILE_HOSTS = ['tile.opentopomap.org', 'server.arcgisonline.com', 'tile.openstreetmap.org', 'wmts.geo.admin.ch'];
const API_HOSTS = ['api.open-meteo.com', 'flood-api.open-meteo.com', 'aws.slf.ch', 'static.avalanche.report', 'api.avalanche.report', 'api01.nve.no'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // Nur EIGENE alte Caches löschen (geteilter *.github.io-Origin: fremde Apps nicht anfassen)
    await Promise.all(keys.filter(k => k.startsWith('gf-') && k !== CORE && k !== TILES).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function trimCache(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length > max) for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigationsanfragen: Netz zuerst, sonst App-Shell (Offline-Start)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // Karten-Kacheln: cache-first, danach Netz (opportunistisch sichern)
  if (TILE_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(TILES);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) { c.put(req, res.clone()); trimCache(TILES, TILE_CAP); }
        return res;
      } catch (err) { return hit || Response.error(); }
    })());
    return;
  }

  // APIs (Wetter/Lawine/Abfluss): nur Netz – zeitkritisch, kein Cache
  if (API_HOSTS.includes(url.hostname)) return;

  // App-Shell & gleiche Origin: cache-first mit Netz-Fallback
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') { const c = await caches.open(CORE); c.put(req, res.clone()); }
        return res;
      } catch (err) { return hit || Response.error(); }
    })());
  }
});

// Offline support. Online: always load the newest files from the network (so updates
// show up right away). Offline or very slow network: fall back to the saved copy.
const CACHE = 'steppy-1.54.0'; // keep in sync with version.js
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'logic.js',
  'fx.js',
  'drive.js',
  'config.js',
  'version.js',
  'themes.js',
  'gumballs.js',
  'weather.js',
  'manifest.webmanifest',
  'icons/favicon-64.png',
  'icons/icon-maskable-512.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/header-halloween.png',
  'icons/header-thanksgiving.png',
  'icons/header-christmas.png',
  'fonts/blackletter.woff2',
  'fonts/pixel.woff2',
  'fonts/varsity.woff2',
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (e) => {
  // cache: 'reload' skips the browser's HTTP cache so we never save stale files.
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const network = fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    /* offline */
  }
  const cached = await cache.match(req, { ignoreSearch: true });
  return cached || network;
}

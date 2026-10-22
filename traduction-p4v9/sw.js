const CACHE = 'traduction-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const net = fetch(req);
      const quick = await Promise.race([net.catch(() => null), new Promise(res => setTimeout(() => res(null), 3000))]);
      if (quick && quick.ok) { if (!url.search) c.put('index.html', quick.clone()); return quick; }
      return (await c.match('index.html')) || net;
    }));
    return;
  }
  const font = ['fonts.googleapis.com','fonts.gstatic.com','www.gstatic.com'].includes(url.hostname);
  if (url.origin !== location.origin && !font) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

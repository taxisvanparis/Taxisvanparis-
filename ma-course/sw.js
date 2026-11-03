// Taxis Van Paris – « Ma course » (mode chauffeur) : notification quand le client écrit
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = { body: e.data ? e.data.text() : '' }; }
  const d = p.data || (p.notification ? { title: p.notification.title, body: p.notification.body } : p);
  e.waitUntil(self.registration.showNotification(d.title || '💬 Message du client', {
    body: d.body || '', icon: '../traduction-p4v9/icon-192.png', tag: d.tag || ('msg-' + Date.now()),
    data: { url: d.url || './' }, renotify: true, vibrate: [300, 120, 300]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const url = (e.notification.data && e.notification.data.url) || './';
    const code = (String(url).match(/[?&]c=([a-z0-9]+)/) || [])[1];
    const liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of liste) {
      if (code && c.url.includes('c=' + code)) { try { await c.focus(); return; } catch (x) {} }
    }
    await self.clients.openWindow(url);
  })());
});

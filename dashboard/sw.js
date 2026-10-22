// Taxis Van Paris – tableau de bord : notifications de nouvelles réservations + pastille sur l'icône
const ETAT = 'tvp-etat', CLE = '/__pastille';
async function lireN() { try { const r = await (await caches.open(ETAT)).match(CLE); return r ? (Number(await r.text()) || 0) : 0; } catch (e) { return 0; } }
async function ecrireN(n) { try { await (await caches.open(ETAT)).put(CLE, new Response(String(n))); } catch (e) {} }
async function pastille(n) { try { if (n > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(n); else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge(); } catch (e) {} }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = { body: e.data ? e.data.text() : '' }; }
  const d = p.data || (p.notification ? { title: p.notification.title, body: p.notification.body } : p);
  e.waitUntil((async () => {
    if (!String(d.tag || '').startsWith('conv-')) { const n = (await lireN()) + 1; await ecrireN(n); await pastille(n); }
    await self.registration.showNotification(d.title || '🚖 Nouvelle réservation', {
      body: d.body || '', icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag || ('resa-' + Date.now()),
      data: { url: d.url || './' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const url = (e.notification.data && e.notification.data.url) || './';
    const conv = (String(url).match(/[?&]conv=([a-z0-9]+)/) || [])[1];
    const liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of liste) { if (c.url.includes('/dashboard')) { try { await c.focus(); if (conv) c.postMessage({ type: 'conv', code: conv }); return; } catch (x) {} } }
    await self.clients.openWindow(conv ? './?conv=' + conv : './');
  })());
});

// Le tableau de bord envoie le nombre de réservations pas encore vues pour remettre la pastille à jour
self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.type === 'pastille') e.waitUntil((async () => { const n = Math.max(0, Number(m.n) || 0); await ecrireN(n); await pastille(n); })());
});

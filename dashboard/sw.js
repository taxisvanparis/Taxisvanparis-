// Taxis Van Paris – tableau de bord : notifications de nouvelles réservations + pastille sur l'icône
const ETAT = 'tvp-etat', CLE = '/__pastille';
async function lireN() { try { const r = await (await caches.open(ETAT)).match(CLE); return r ? (Number(await r.text()) || 0) : 0; } catch (e) { return 0; } }
async function ecrireN(n) { try { await (await caches.open(ETAT)).put(CLE, new Response(String(n))); } catch (e) {} }
async function pastille(n) { try { if (n > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(n); else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge(); } catch (e) {} }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Course dans moins d'une heure (ou « Maintenant ») d'après la ligne « 📅 jj/mm/aaaa … à HH:MM »
function estImmediate(t) {
  if (/maintenant/i.test(t)) return true;
  const m = String(t).match(/(\d{2})\/(\d{2})\/(\d{4})[^\n]*?(\d{1,2})[:h](\d{2})/) || String(t).match(/(\d{4})-(\d{2})-(\d{2})[^\n]*?(\d{1,2})[:h](\d{2})/);
  if (!m) return false;
  const d = m[1].length === 4 ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  const mn = (d - Date.now()) / 60000;
  return mn <= 60 && mn >= -30;
}

self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = { body: e.data ? e.data.text() : '' }; }
  const d = p.data || (p.notification ? { title: p.notification.title, body: p.notification.body } : p);
  e.waitUntil((async () => {
    const n = (await lireN()) + 1;
    await ecrireN(n);
    await pastille(n);
    const imm = estImmediate(d.body || '');
    await self.registration.showNotification((imm ? '⚡ IMMÉDIAT · ' : '') + (d.title || '🚖 Nouvelle réservation'), {
      body: d.body || '', icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag || ('resa-' + Date.now()),
      data: { url: d.url || './' }, renotify: true,
      requireInteraction: imm,                                   // reste affichée jusqu'au toucher (Android, ordinateur)
      vibrate: imm ? [600, 200, 600, 200, 600, 200, 1200] : [300, 120, 300]
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of liste) { if (c.url.includes('/dashboard')) { try { await c.focus(); return; } catch (x) {} } }
    await self.clients.openWindow('./');
  })());
});

// Le tableau de bord envoie le nombre de réservations pas encore vues pour remettre la pastille à jour
self.addEventListener('message', e => {
  const m = e.data || {};
  if (m.type === 'pastille') e.waitUntil((async () => { const n = Math.max(0, Number(m.n) || 0); await ecrireN(n); await pastille(n); })());
});

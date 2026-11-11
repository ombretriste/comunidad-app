// Cambia la versión al modificar archivos para que los móviles descarguen la nueva versión
const CACHE = 'micomunidad-v34';
const ASSETS = [
  './',
  'index.html',
  'boot.js',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Red primero (para recibir actualizaciones); caché si no hay conexión. La API nunca se cachea.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.match(/\/api\/|^\/_vercel\//)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ---------- Avisos ----------
// El push llega vacío: se recogen del servidor los avisos pendientes de este dispositivo (su
// identificador lo guarda la app en IndexedDB) y se enseñan. Siempre se muestra algo, porque Safari
// retira el permiso si un push no enseña ninguna notificación.
function kvGet(key) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('micomunidad', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => {
        const get = req.result.transaction('kv', 'readonly').objectStore('kv').get(key);
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => resolve(undefined);
      };
      req.onerror = () => resolve(undefined);
    } catch (_) { resolve(undefined); }
  });
}
async function handlePush() {
  const p = await kvGet('push');
  let notes = [];
  let name = 'Mi comunidad';
  if (p && p.device) {
    try {
      const res = await fetch('api/comunidad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'notes', device: p.device }) });
      const json = await res.json();
      notes = json.notes || [];
      name = json.name || name;
    } catch (_) { /* sin conexión */ }
  }
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  wins.forEach((w) => w.postMessage({ type: 'refresh' }));
  const opts = { icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  if (!notes.length) return self.registration.showNotification(name, { ...opts, body: 'Hay novedades en tu comunidad', tag: 'novedades', data: { go: '' } });
  // De cada tema (chat, tablón, una conversación…) se enseña el último
  const byTag = new Map();
  notes.forEach((n) => { byTag.delete(n.tag || n.t); byTag.set(n.tag || n.t, n); });
  for (const n of [...byTag.values()].slice(-4)) {
    await self.registration.showNotification(n.title || name, { ...opts, body: n.body, tag: n.tag || undefined, renotify: !!n.tag, timestamp: n.t, requireInteraction: /^(call|gc)-/.test(n.tag || ''), data: { go: n.go || '' } });
  }
}
self.addEventListener('push', (event) => event.waitUntil(handlePush()));

// Al tocar un aviso se abre (o se trae al frente) la app en esa sección
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const go = (event.notification.data && event.notification.data.go) || '';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if ('focus' in w) { await w.focus(); w.postMessage({ type: 'go', go }); return; }
    }
    await self.clients.openWindow(go ? `./?go=${encodeURIComponent(go)}` : './');
  })());
});

const CACHE = 'gheymato-v3';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg',
  './css/app.css',
  './js/core.js',
  './js/api.js',
  './js/charts.js',
  './js/ui.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isAPI = url.hostname.includes('tgju.org');

  if(isAPI){
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if(sameOrigin){
    e.respondWith(
      caches.match(req).then(cached => {
        if(cached) return cached;
        return fetch(req).then(res => {
          if(res.status === 200){
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});
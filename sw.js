/**
 * قیمتو 6.0 — Service Worker
 * ✅ Cache-first برای فایل‌های ثابت
 * ✅ Network-first برای API
 * ✅ Auto-update وقتی VERSION عوض می‌شود
 */

const VERSION = 'gheymato-v5-' + '20260927';   // ← هر بار تغییر بده
const CACHE = VERSION;

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.png',        // ✅ png نه svg
  './css/app.css',
  './js/icons.js',
  './js/core.js',
  './js/data.js',             // ✅ اضافه شد
  './js/api.js',
  './js/charts.js',
  './js/tv.js',
  './js/ui.js',
  './js/app.js'
];

/* ═══════════════════════════════════════════
   INSTALL
═══════════════════════════════════════════ */
self.addEventListener('install', function(e){
  console.log('[SW] installing...');
  
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // ✅ خطا را نپوشان — ببین چه چیزی fail می‌شود
      return Promise.all(
        CORE.map(function(url){
          return c.add(url).catch(function(err){
            console.warn('[SW] failed to cache:', url, err.message);
          });
        })
      );
    })
  );
  
  // ✅ فوراً فعال شود
  self.skipWaiting();
});

/* ═══════════════════════════════════════════
   ACTIVATE
═══════════════════════════════════════════ */
self.addEventListener('activate', function(e){
  console.log('[SW] activating...');
  
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key !== CACHE){
            console.log('[SW] deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(function(){
      // ✅ کنترل تمام tabها
      return self.clients.claim();
    })
  );
});

/* ═══════════════════════════════════════════
   FETCH
═══════════════════════════════════════════ */
self.addEventListener('fetch', function(e){
  const req = e.request;
  
  if(req.method !== 'GET') return;
  
  const url = new URL(req.url);
  
  // ═══ فایل‌های API (data/*.json) → Network-First ═══
  if(url.pathname.indexOf('/data/') !== -1){
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(function(res){
          if(res.ok){
            const clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(req, clone); });
          }
          return res;
        })
        .catch(function(){
          return caches.match(req);
        })
    );
    return;
  }
  
  // ═══ فایل‌های ثابت (HTML/CSS/JS) → Cache-First ═══
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(function(cached){
        if(cached){
          return cached;
        }
        return fetch(req).then(function(res){
          if(res.ok){
            const clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(req, clone); });
          }
          return res;
        });
      })
    );
  }
});

/* ═══════════════════════════════════════════
   MESSAGE — پاک کردن کش به درخواست
═══════════════════════════════════════════ */
self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting'){
    self.skipWaiting();
  }
  if(e.data === 'clearCache'){
    caches.keys().then(function(keys){
      keys.forEach(function(key){ caches.delete(key); });
    });
    self.registration.unregister();
  }
});
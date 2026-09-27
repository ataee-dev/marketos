/**
 * Service Worker — موقتاً غیرفعال
 * خودش را unregister می‌کند
 */
self.addEventListener('install', function(e){
  console.log('[SW] installing (temp disabled)');
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  console.log('[SW] activating — unregistering itself');
  self.registration.unregister()
    .then(function(){
      return self.clients.matchAll();
    })
    .then(function(clients){
      clients.forEach(function(client){
        client.navigate(client.url);
      });
    });
});

// هیچ fetch handler نگذار — این باعث می‌شود همه چیز از شبکه لود شود
/**
 * قیمتو 5.5 — APP BOOT
 */
(function(){
'use strict';

/* ============================================================
   GESTURES
============================================================ */
window.Gestures = (function(){
  const state = { enabled: true };

  function attachPageSwipe(container){
    if(!container) return;
    let sx = 0, sy = 0, st = 0, tracking = false;
    container.addEventListener('touchstart', e => {
      if(!state.enabled) return;
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; st = Date.now();
      tracking = true;
    }, {passive:true});
    container.addEventListener('touchend', e => {
      if(!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dt = Date.now() - st;
      if(dt > 700 || Math.abs(dx) < 100 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const pages = ['home','markets','chart','compare','favorites','settings'];
      const cur = document.querySelector('.page.is-active')?.dataset.page || 'home';
      const i = pages.indexOf(cur);
      if(dx > 0 && i < pages.length - 1 && window.UI) window.UI.go(pages[i+1]);
      else if(dx < 0 && i > 0 && window.UI) window.UI.go(pages[i-1]);
    }, {passive:true});
  }

  function init(){
    const content = document.querySelector('.content');
    if(content) attachPageSwipe(content);
    console.log('[Gestures] ✓');
  }

  return { init };
})();

/* ============================================================
   ANIMATIONS
============================================================ */
window.Anim = (function(){
  function attachRipple(){
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn, .chip, .tool-chip, .cat-chip, .mnav-btn, .nav-link');
      if(!btn) return;
      const cs = getComputedStyle(btn);
      if(cs.position === 'static') btn.style.position = 'relative';
      if(cs.overflow !== 'hidden') btn.style.overflow = 'hidden';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size/2;
      const y = e.clientY - rect.top - size/2;
      const ripple = document.createElement('span');
      ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,.35);transform:scale(0);animation:rippleAnim .6s cubic-bezier(.22,1,.36,1);pointer-events:none;z-index:1;`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  function init(){
    if(!document.getElementById('anim-keyframes')){
      const style = document.createElement('style');
      style.id = 'anim-keyframes';
      style.textContent = `
        @keyframes rippleAnim{to{transform:scale(4);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `;
      document.head.appendChild(style);
    }
    attachRipple();
    console.log('[Anim] ✓');
  }

  return { init };
})();

/* ============================================================
   SPLASH + OFFLINE
============================================================ */
function hideSplash(){
  const s = document.querySelector('[data-splash]');
  if(!s) return;
  setTimeout(() => s.classList.add('is-hidden'), 1200);
}

function initOnlineStatus(){
  const offline = document.querySelector('[data-offline]');
  if(!offline) return;

  function update(){
    if(navigator.onLine){
      offline.classList.remove('is-active');
    } else {
      offline.classList.add('is-active');
    }
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();

  offline.querySelector('[data-retry]')?.addEventListener('click', () => {
    if(navigator.onLine){
      offline.classList.remove('is-active');
      window.API.fetchData(true).catch(() => {});
    } else {
      if(window.UI) window.UI.toast('هنوز آفلاین هستید', 'warning');
    }
  });
}

/* ============================================================
   BOOT
============================================================ */
function boot(){
  console.log('%cقیمتو 6.0', 'color:#10b981;font-size:20px;font-weight:900');

  try {
    // 1. Config
    if(window.CFG){
      CFG.load();
      document.body.classList.toggle('dark', CFG.get('theme') === 'dark');
    }

    // 2. Icons
    if(window.Icons?.hydrate) Icons.hydrate();
    if(window.Icons?.installImageFallback) Icons.installImageFallback();

    // 3. UI
    if(window.UI?.init) UI.init();

    // 4. TV
    if(window.TV?.init) TV.init();

    // 5. Anim
    if(window.Anim?.init) Anim.init();

    // 6. Gestures
    if(window.Gestures?.init) Gestures.init();

    // 7. Online/Offline
    initOnlineStatus();

    // 8. API
    if(window.API){
      const interval = CFG.get('refreshInterval') || 60000;
      if(CFG.get('autoRefresh') !== false) API.start(interval);
      else API.fetchData().catch(() => {});
    }

    // ═══ 9. Hide Splash ═══
    hideSplashIframe();

    console.log('%c[قیمتو] ✓ آماده', 'color:#10b981;font-weight:900');
  } catch(err){
    console.error('[Boot]', err);
    hideSplashIframe();
  }
}

/* ═══ Splash Iframe ═══ */
function hideSplashIframe(){
  const frame = document.getElementById('splashFrame');
  if(!frame) return;

  try {
    frame.contentWindow.postMessage('splash:hide', '*');
  } catch(e){}

  // حذف کامل iframe پس از انیمیشن
  setTimeout(() => {
    if(frame.parentNode) frame.parentNode.removeChild(frame);
  }, 1000);
}

/* ═══ Online/Offline Iframe ═══ */
function initOnlineStatus(){
  const offlineFrame = document.getElementById('offlineFrame');
  if(!offlineFrame) return;

  function showOffline(){
    offlineFrame.style.display = 'block';
    offlineFrame.style.pointerEvents = 'auto';
    try {
      offlineFrame.contentWindow.postMessage('offline:show', '*');
    } catch(e){}
  }

  function hideOffline(){
    offlineFrame.style.display = 'none';
    offlineFrame.style.pointerEvents = 'none';
    try {
      offlineFrame.contentWindow.postMessage('offline:hide', '*');
    } catch(e){}
  }

  function update(){
    if(navigator.onLine){
      hideOffline();
    } else {
      showOffline();
    }
  }

  window.addEventListener('online', () => {
    if(window.UI) UI.toast('اتصال برقرار شد ✓', 'success');
    setTimeout(update, 800);
  });

  window.addEventListener('offline', () => {
    showOffline();
  });

  // پیام از iframe
  window.addEventListener('message', (e) => {
    if(e.data === 'offline:reconnect'){
      setTimeout(hideOffline, 500);
    }
    if(e.data === 'offline:retry-success'){
      if(window.UI) UI.toast('اتصال برقرار شد ✓', 'success');
      setTimeout(hideOffline, 500);
    }
  });

  // بررسی اولیه
  update();
}

})();
/**
 * قیمتو 6.0 — APP BOOT
 * ✅ انتظار برای DATA
 * ✅ مخفی کردن Splash
 * ✅ بدون خطای undefined
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
    container.addEventListener('touchstart', function(e){
      if(!state.enabled) return;
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; st = Date.now();
      tracking = true;
    }, {passive:true});
    container.addEventListener('touchend', function(e){
      if(!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const dt = Date.now() - st;
      if(dt > 700 || Math.abs(dx) < 100 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const pages = ['home','markets','chart','compare','favorites','cars','settings'];
      const cur = document.querySelector('.page.is-active');
      const curPage = cur ? cur.dataset.page : 'home';
      const i = pages.indexOf(curPage);
      if(dx > 0 && i < pages.length - 1 && window.UI) window.UI.go(pages[i+1]);
      else if(dx < 0 && i > 0 && window.UI) window.UI.go(pages[i-1]);
    }, {passive:true});
  }

  function init(){
    const content = document.querySelector('.content');
    if(content) attachPageSwipe(content);
    console.log('[Gestures] ✓');
  }

  return { init: init };
})();

/* ============================================================
   ANIMATIONS
============================================================ */
window.Anim = (function(){
  function attachRipple(){
    document.addEventListener('click', function(e){
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
      ripple.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px;border-radius:50%;background:rgba(255,255,255,.35);transform:scale(0);animation:rippleAnim .6s cubic-bezier(.22,1,.36,1);pointer-events:none;z-index:1;';
      btn.appendChild(ripple);
      setTimeout(function(){ ripple.remove(); }, 700);
    });
  }

  function init(){
    if(!document.getElementById('anim-keyframes')){
      const style = document.createElement('style');
      style.id = 'anim-keyframes';
      style.textContent =
        '@keyframes rippleAnim{to{transform:scale(4);opacity:0}}' +
        '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }
    attachRipple();
    console.log('[Anim] ✓');
  }

  return { init: init };
})();

/* ============================================================
   SPLASH — مخفی کردن
============================================================ */
function hideSplash(){
  // نسخه inline (index.html جدید)
  const s = document.getElementById('splashScreen');
  if(s){
    s.classList.add('is-hidden');
    setTimeout(function(){
      if(s.parentNode) s.parentNode.removeChild(s);
    }, 500);
    return;
  }

  // fallback قدیمی (data-splash)
  const s2 = document.querySelector('[data-splash]');
  if(s2) setTimeout(function(){ s2.classList.add('is-hidden'); }, 800);

  // API
  if(window.Splash && window.Splash.hide){
    window.Splash.hide();
  }
}

/* ============================================================
   ONLINE / OFFLINE
============================================================ */
function initOnlineStatus(){
  const offline = document.getElementById('offlineScreen');
  if(!offline) return;

  function update(){
    if(navigator.onLine){
      offline.style.display = 'none';
    } else {
      offline.style.display = 'flex';
    }
  }

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();

  const retry = document.getElementById('offlineRetry');
  if(retry){
    retry.addEventListener('click', function(){
      if(navigator.onLine){
        offline.style.display = 'none';
        window.API.fetchData(true).catch(function(){});
      } else {
        if(window.UI) window.UI.toast('هنوز آفلاین هستید', 'warning');
      }
    });
  }
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
    if(window.Icons && window.Icons.hydrate) window.Icons.hydrate();
    if(window.Icons && window.Icons.installImageFallback) window.Icons.installImageFallback();

    // 3. Anim
    if(window.Anim && window.Anim.init) window.Anim.init();

    // 4. Gestures
// ═══ Swipe غیرفعال — توسط ui.js مدیریت می‌شود ═══
// if(window.Gestures && window.Gestures.init) window.Gestures.init();

    // 5. Online/Offline
    initOnlineStatus();

    // 6. TV
    if(window.TV && window.TV.init) window.TV.init();

    // ═══ 7. UI — انتظار برای DATA ═══
    function initUIWhenReady(attempts){
      attempts = attempts || 0;

      // چک آماده بودن DATA
      if(window.DATA && window.DATA.ASSETS && window.DATA.ASSETS.length > 0){

        if(window.UI && window.UI.init){
          UI.init();
          console.log('%c[UI] ✓ آماده', 'color:#10b981;font-weight:900');
        }

        // 8. API
        if(window.API){
          const interval = CFG.get('refreshInterval') || 60000;
          if(CFG.get('autoRefresh') !== false) API.start(interval);
          else API.fetchData().catch(function(){});
        }

        // 9. مخفی کردن Splash
        hideSplash();

        console.log('%c[قیمتو] ✓ آماده', 'color:#10b981;font-weight:900');
        return;
      }

      // تلاش مجدد (حداکثر ۵۰ بار = ۲.۵ ثانیه)
      if(attempts < 50){
        setTimeout(function(){ initUIWhenReady(attempts + 1); }, 50);
      } else {
        console.error('[Boot] DATA آماده نشد');
        hideSplash();
      }
    }

    initUIWhenReady();

  } catch(err){
    console.error('[Boot]', err);
    hideSplash();
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})();
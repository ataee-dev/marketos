/**
 * قیمتو 6.0 — TV MODE
 * فقط ماژول TV — boot و Gestures و Anim در app.js هستند
 */
window.TV = (function(){
'use strict';

let active = false;
let wrap = null;
let timer = null;
let currentIdx = 0;
let slideInterval = 5000;

const TV_IDS = [
  'gold18', 'coin', 'dollar', 'euro', 'ounce', 'mesghal',
  'btc', 'eth', 'silver', 'oil_brent', 'bourse', 'usdt',
  'gold24', 'coin_bahar', 'gbp', 'aed', 'sol', 'xrp',
  'doge', 'ada', 'bnb', 'xauusd', 'xagusd'
];

/* ============================================================
   BUILD TV LAYOUT
============================================================ */
function buildLayout(){
  if(wrap) return wrap;

  wrap = document.createElement('div');
  wrap.className = 'tv-mode';
  wrap.setAttribute('data-tv', '');
  wrap.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: linear-gradient(160deg, #0b1220 0%, #0f172a 60%, #0a0f1a 100%);
    display: none; flex-direction: column;
    color: #fff; overflow: hidden;
  `;

  wrap.innerHTML = `
    <div class="tv-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,.08)">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px">ق</div>
        <div>
          <div style="font-weight:800;font-size:15px">قیمتو — حالت TV</div>
          <div style="font-size:11px;opacity:.6" data-tv-clock>--:--:--</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" data-tv-pause style="background:rgba(255,255,255,.1);border:0;color:#fff;padding:8px 16px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px">توقف</button>
        <button type="button" data-tv-close style="background:rgba(239,68,68,.2);border:0;color:#fca5a5;padding:8px 16px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700">خروج</button>
      </div>
    </div>

    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <div data-tv-hero style="padding:32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,.06)"></div>

      <div data-tv-grid style="flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:20px 24px;overflow-y:auto;align-content:start"></div>
    </div>

    <div class="tv-footer" style="padding:12px 24px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;font-size:11px;opacity:.5">
      <span>قیمتو 6.0 — به‌روزرسانی زنده</span>
      <span data-tv-status>در حال اتصال...</span>
    </div>
  `;

  document.body.appendChild(wrap);

  wrap.querySelector('[data-tv-close]').addEventListener('click', close);
  wrap.querySelector('[data-tv-pause]').addEventListener('click', function(){
    if(timer){
      clearInterval(timer);
      timer = null;
      this.textContent = 'ادامه';
    } else {
      startSlide();
      this.textContent = 'توقف';
    }
  });

  return wrap;
}

/* ============================================================
   RENDER
============================================================ */
function fmt(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';
  if(window.UI && window.UI.formatPrice){
    return window.UI.formatPrice(asset, rialValue);
  }
  if(asset && asset.ptype === 'usd'){
    return '$' + (window.U ? window.U.num(rialValue, 2) : rialValue.toFixed(2));
  }
  return (window.U ? window.U.num(rialValue, 0) : rialValue) + ' ریال';
}

function renderHero(){
  const hero = wrap.querySelector('[data-tv-hero]');
  if(!hero) return;

  const validIds = TV_IDS.filter(function(id){
    return window.DATA && window.DATA.find && window.DATA.find(id);
  });
  if(!validIds.length) return;

  currentIdx = currentIdx % validIds.length;
  const id = validIds[currentIdx];
  const a = window.DATA.find(id);
  if(!a) return;

  const live = window.API ? window.API.getById(id) : null;
  const price = live && live.price != null ? live.price : null;
  const cp = live ? (live.changePercent || 0) : 0;
  const up = cp >= 0;

  hero.innerHTML = `
    <div style="font-size:14px;opacity:.6;margin-bottom:8px">${a.name}</div>
    <div style="font-size:48px;font-weight:900;direction:ltr;letter-spacing:-1px;margin-bottom:12px">
      ${price != null ? fmt(a, price) : '—'}
    </div>
    <div style="font-size:18px;font-weight:800;color:${up ? '#10b981' : '#ef4444'}">
      ${up ? '▲' : '▼'} ${Math.abs(cp).toFixed(2)}%
    </div>
  `;
}

function renderGrid(){
  const grid = wrap.querySelector('[data-tv-grid]');
  if(!grid) return;

  if(!window.DATA || !window.DATA.ASSETS){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;opacity:.5;padding:40px">در حال بارگذاری داده‌ها...</div>';
    return;
  }

  const list = TV_IDS
    .map(function(id){ return window.DATA.find(id); })
    .filter(Boolean);

  grid.innerHTML = list.map(function(a){
    const live = window.API ? window.API.getById(a.id) : null;
    const price = live && live.price != null ? live.price : null;
    const cp = live ? (live.changePercent || 0) : 0;
    const up = cp >= 0;

    return `
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px">
        <div style="font-size:12px;opacity:.6;margin-bottom:6px">${a.short || a.name}</div>
        <div style="font-size:18px;font-weight:800;direction:ltr;margin-bottom:4px">
          ${price != null ? fmt(a, price) : '—'}
        </div>
        <div style="font-size:12px;font-weight:700;color:${up ? '#10b981' : '#ef4444'}">
          ${up ? '▲' : '▼'} ${Math.abs(cp).toFixed(2)}%
        </div>
      </div>
    `;
  }).join('');
}

function renderClock(){
  const el = wrap.querySelector('[data-tv-clock]');
  if(!el) return;
  el.textContent = new Date().toLocaleTimeString('fa-IR');
}

function renderStatus(){
  const el = wrap.querySelector('[data-tv-status]');
  if(!el) return;
  el.textContent = navigator.onLine ? 'آنلاین — به‌روزرسانی زنده' : 'آفلاین — داده‌های ذخیره‌شده';
}

/* ============================================================
   REFRESH
============================================================ */
function refresh(){
  if(!active || !wrap) return;
  renderHero();
  renderGrid();
  renderClock();
  renderStatus();
}

/* ============================================================
   SLIDE
============================================================ */
function startSlide(){
  if(timer) clearInterval(timer);
  timer = setInterval(function(){
    currentIdx++;
    renderHero();
  }, slideInterval);
}

/* ============================================================
   PUBLIC
============================================================ */
function init(){
  // فقط ساخت layout — نمایش با open()
  console.log('[TV] ✓');
}

function open(){
  if(active) return;
  buildLayout();

  wrap.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  active = true;
  currentIdx = 0;

  refresh();
  startSlide();

  // به‌روزرسانی مداوم
  window.addEventListener('resize', refresh);

  console.log('[TV] باز شد');
}

function close(){
  if(!active || !wrap) return;

  if(timer){ clearInterval(timer); timer = null; }

  wrap.style.display = 'none';
  document.body.style.overflow = '';
  active = false;

  window.removeEventListener('resize', refresh);

  console.log('[TV] بسته شد');
}

function isActive(){ return active; }

/* ============================================================
   AUTO SUBSCRIBE به API
============================================================ */
function subscribeAPI(){
  if(window.API && window.API.subscribe){
    window.API.subscribe(function(){
      if(active) refresh();
    });
  }
}

// یک‌بار subscribe کن
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', subscribeAPI);
} else {
  subscribeAPI();
}

return {
  init: init,
  open: open,
  close: close,
  isActive: isActive,
  refresh: refresh
};

})();
/**
 * قیمتو 5.5 — ICONS
 * ✅ فقط فایل‌های موجود در assets/icons/ استفاده می‌شود
 * ✅ Fallback امن به SVG inline (بدون XSS)
 */
window.Icons = (function(){
'use strict';

/* ============================================================
   UI ICONS (inline SVG)
============================================================ */
const UI = {
  home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
  barChart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>`,
  activity:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  swap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/></svg>`,
  list:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`,
  starFilled:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`,
  calculator:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M8 14h2M8 18h2M14 10h2M14 14h2M14 18h2"/></svg>`,
  coins:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/></svg>`,
  dollarSign:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  exchange:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3"/></svg>`,
  briefcase:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  bell:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`,
  globe:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  external:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>`,
  code:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
  shield:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`,
  refresh:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  menu:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
  arrowUp:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  arrowDown:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`,
  arrowLeft:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  arrowRight:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  trendingUp:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>`,
  trendingDown:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M23 18l-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>`,
  bitcoin:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h5a3 3 0 0 1 0 6H9m0 0h5a3 3 0 0 1 0 6H9m2-14v2m0 12v2m2-16v2m0 12v2"/></svg>`,
  ethereum:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l6 10-6 4-6-4z"/><path d="M12 16l6-4-6 10-6-10z"/></svg>`,
  tether:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7 8h10M12 8v10M9.5 12h5"/></svg>`,
  diamond:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>`,
  zap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>`,
  grid:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  tv:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M17 2l-5 5-5-5"/></svg>`,
  info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  eye:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  note:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>`,
  file:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
  alert:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  lock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  car:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 17v2m14-2v2M7 13l1.5-4.5A1 1 0 0 1 9.4 8h5.2a1 1 0 0 1 .9.6L17 13"/></svg>`,
  filter:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>`,
  calendar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
};
/* ============================================================
   فقط آیکون‌های موجود در assets/icons/
============================================================ */
const AVAILABLE_ICONS = new Set([
  'ada', 'aed', 'afn', 'aluminium', 'aud', 'bnb', 'brent', 'btc',
  'cad', 'chf', 'cny', 'coffee', 'coin', 'copper', 'corn', 'doge',
  'dot', 'eth', 'eur', 'gas', 'gbp', 'gold', 'iqd', 'jpy', 'kwd',
  'ltc', 'oil', 'oill', 'palladium', 'platinum', 'rub', 'sar',
  'silver', 'sol', 'sugar', 'try', 'usd', 'usdt', 'wheat', 'xrp'
]);

/* ============================================================
   ASSET → ICON FILE MAPPING
============================================================ */
const ASSET_ICON_MAP = {
  // طلا و سکه
  gold18: 'gold', gold24: 'gold', gold17: 'gold',
  mesghal: 'gold', gold_melted: 'gold', gold_transfer: 'gold',
  gold_mini: 'gold', gold_740k: 'gold', ounce: 'gold',
  coin: 'coin', coin_bahar: 'coin', nim: 'coin', rob: 'coin', gerami: 'coin',

  // ارز
  dollar: 'usd', dollar_dt: 'usd', dollar_ex: 'usd',
  euro: 'eur', gbp: 'gbp',
  aed: 'aed', try_: 'try', cny: 'cny', jpy: 'jpy',
  cad: 'cad', aud: 'aud', chf: 'chf', rub: 'rub',
  sar: 'sar', kwd: 'kwd', iqd: 'iqd', afn: 'afn',

  // فلزات
  silver: 'silver', silver_999: 'silver', silver_925: 'silver',
  platinum: 'platinum', palladium: 'palladium',
  copper: 'copper', aluminium: 'aluminium',

  // انرژی
  oil: 'oil', oil_brent: 'brent', gas: 'gas',

  // کریپتو
  btc: 'btc', eth: 'eth', usdt: 'usdt', bnb: 'bnb', xrp: 'xrp',
  ada: 'ada', sol: 'sol', doge: 'doge', ltc: 'ltc', dot: 'dot',

  // کالا
  wheat: 'wheat', corn: 'corn', sugar: 'sugar', coffee: 'coffee',

  // توکن طلا
  xaut: 'gold', paxg: 'gold', ugold: 'gold', kau: 'gold', gdao: 'gold'
};

/* ============================================================
   HELPERS
============================================================ */
function get(name){
  return UI[name] || UI.barChart;
}

function getIconFileName(asset){
  if(!asset) return null;
  const fileName = ASSET_ICON_MAP[asset.id];
  if(fileName && AVAILABLE_ICONS.has(fileName)) return fileName;
  return null;
}

function assetSVG(asset){
  if(!asset) return '';

  const fileName = getIconFileName(asset);

  if(fileName){
    return `<img src="assets/icons/${fileName}.png"
                 alt="${(asset.code || '').replace(/"/g, '&quot;')}"
                 loading="lazy"
                 draggable="false"
                 data-icon-name="${fileName}">`;
  }

  const catIconMap = {
    gold: 'coins', currency: 'dollarSign', metal: 'diamond',
    energy: 'zap', crypto: 'bitcoin', commodity: 'briefcase',
    index: 'barChart', goldCrypto: 'coins', ratio: 'trendingUp'
  };

  const iconName = asset.icon || catIconMap[asset.cat] || 'barChart';
  return `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">${get(iconName)}</span>`;
}

function hydrate(root){
  if(!root) root = document;
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    el.innerHTML = get(name);
    el.removeAttribute('data-icon');
  });
}

function installImageFallback(){
  if(window.__iconFallbackInstalled) return;
  window.__iconFallbackInstalled = true;

  document.addEventListener('error', e => {
    const img = e.target;
    if(!img || img.tagName !== 'IMG') return;
    if(!img.dataset.iconName) return;
    if(img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';

    const fallbackName = {
      gold: 'coins', coin: 'coins', usd: 'dollarSign', eur: 'dollarSign',
      gbp: 'dollarSign', aed: 'dollarSign', try: 'dollarSign',
      cny: 'dollarSign', jpy: 'dollarSign', cad: 'dollarSign',
      aud: 'dollarSign', chf: 'dollarSign', rub: 'dollarSign',
      sar: 'dollarSign', kwd: 'dollarSign', iqd: 'dollarSign',
      afn: 'dollarSign', silver: 'diamond', platinum: 'diamond',
      palladium: 'diamond', copper: 'diamond', aluminium: 'diamond',
      oil: 'zap', brent: 'zap', gas: 'zap',
      btc: 'bitcoin', eth: 'ethereum', usdt: 'tether', bnb: 'bitcoin',
      xrp: 'bitcoin', ada: 'bitcoin', sol: 'bitcoin', doge: 'bitcoin',
      ltc: 'bitcoin', dot: 'bitcoin',
      wheat: 'briefcase', corn: 'briefcase', sugar: 'briefcase',
      coffee: 'briefcase'
    }[img.dataset.iconName] || 'barChart';

    const span = document.createElement('span');
    span.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:currentColor';
    span.innerHTML = get(fallbackName);
    img.replaceWith(span);
  }, true);
}

return {
  get,
  hydrate,
  assetSVG,
  installImageFallback,
  assetMap: ASSET_ICON_MAP,
  availableIcons: AVAILABLE_ICONS,
  all: () => Object.keys(UI)
};

})();
/**
 * قیمتو 5.9 — API
 * ✅ خواندن از GitHub Pages
 * ✅ annual-history.json (۳۰ روز کامل با o/h/l/p/d)
 * ✅ history/ روزانه (پشتیبان)
 * ✅ getPriceAt برای بازه‌های زمانی
 * ✅ cache هوشمند
 * ✅ بدون CORS
 */
window.API = (function(){
'use strict';

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  DATA_BASE: 'https://ataee-dev.github.io/marketos/data',
  RAW_BASE: 'https://raw.githubusercontent.com/ataee-dev/marketos/main/data',
  cacheTTL: 30000,           // ۳۰ ثانیه برای latest
  annualCacheTTL: 5 * 60000, // ۵ دقیقه برای annual
  poll: 60000,               // ۶۰ ثانیه polling
  timeout: 8000,
  retries: 2
};

/* ============================================================
   STATE
============================================================ */
let raw = null;
let norm = {};
let lastFetch = 0;
let lastError = null;
let fetching = false;
let fallback = false;
let timer = null;
let subs = new Set();
let currentSource = 'primary';

// کش annual-history
let annualCache = null;
let annualCacheTime = 0;

// کش history روزانه
const HISTORY_CACHE = new Map();
const HISTORY_TTL = 5 * 60 * 1000;

// کش منفی — فایل‌های ناموجود
const NEGATIVE_CACHE = new Set();

/* ============================================================
   HELPERS
============================================================ */
function cleanNum(v){
  if(v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function normalize(key, item){
  if(!item) return null;
  return {
    key: key,
    price: cleanNum(item.p),
    high: cleanNum(item.h),
    low: cleanNum(item.l),
    open: cleanNum(item.o),
    change: cleanNum(item.d),
    changePercent: cleanNum(item.dp),
    time: item.t || '',
    timeEn: item.t_en || '',
    timestamp: item.ts || ''
  };
}

/**
 * تبدیل تاریخ میلادی (2026/09/24) به timestamp
 */
function parseGregorianDate(gd){
  if(!gd) return null;
  const parts = String(gd).split('/');
  if(parts.length !== 3) return null;
  const y = parseInt(parts[0]);
  const m = parseInt(parts[1]) - 1;
  const d = parseInt(parts[2]);
  if(isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d).getTime();
}

/* ============================================================
   LOCAL CACHE
============================================================ */
const LCKEY = 'gheymato.last.v9';

function saveLocal(){
  try {
    if(norm && Object.keys(norm).length){
      localStorage.setItem(LCKEY, JSON.stringify({
        d: norm,
        t: lastFetch
      }));
    }
  } catch(e){}
}

function loadLocal(){
  try {
    const raw2 = localStorage.getItem(LCKEY);
    if(!raw2) return false;
    const p = JSON.parse(raw2);
    if(!p || !p.d) return false;
    norm = p.d;
    lastFetch = p.t || Date.now();
    fallback = true;
    return true;
  } catch(e){ return false; }
}

/* ============================================================
   FETCH
============================================================ */
async function fetchJSON(url, attempt){
  attempt = attempt || 0;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(function(){ ctrl.abort(); }, CONFIG.timeout);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(tid);

    if(!res.ok) throw new Error('HTTP ' + res.status);
    const txt = await res.text();
    if(txt.length < 50) throw new Error('پاسخ کوچک');
    return JSON.parse(txt);

  } catch(err){
    if(attempt < CONFIG.retries){
      await new Promise(function(r){ setTimeout(r, 800 * (attempt + 1)); });
      return fetchJSON(url, attempt + 1);
    }
    throw err;
  }
}

/**
 * دریافت latest.json
 */
async function fetchLatest(){
  const url = CONFIG.DATA_BASE + '/latest.json?_=' + Date.now();
  try {
    const json = await fetchJSON(url);
    currentSource = 'primary';
    return json;
  } catch(err){
    console.warn('[API] Primary failed, trying raw...');
    const url2 = CONFIG.RAW_BASE + '/latest.json?_=' + Date.now();
    const json = await fetchJSON(url2);
    currentSource = 'raw';
    return json;
  }
}

/**
 * دریافت annual-history.json (با cache)
 */
async function fetchAnnual(){
  // کش در حافظه
  if(annualCache && (Date.now() - annualCacheTime) < CONFIG.annualCacheTTL){
    return annualCache;
  }

  const url = CONFIG.DATA_BASE + '/annual-history.json';
  try {
    const json = await fetchJSON(url);
    annualCache = json;
    annualCacheTime = Date.now();
    console.log('[API] ✅ annual-history loaded: ' + Object.keys(json.symbols || {}).length + ' symbols');
    return json;
  } catch(err){
    console.warn('[API] annual-history failed:', err.message);
    return null;
  }
}

/**
 * دریافت history روزانه (پشتیبان)
 */
async function fetchHistory(date){
  if(NEGATIVE_CACHE.has(date)) return null;

  const cached = HISTORY_CACHE.get(date);
  if(cached && (Date.now() - cached.t) < HISTORY_TTL){
    return cached.data;
  }

  const url = CONFIG.DATA_BASE + '/history/' + date + '.json?_=' + Date.now();
  try {
    const json = await fetchJSON(url);
    HISTORY_CACHE.set(date, { data: json, t: Date.now() });
    return json;
  } catch(err){
    try {
      const url2 = CONFIG.RAW_BASE + '/history/' + date + '.json?_=' + Date.now();
      const json = await fetchJSON(url2);
      HISTORY_CACHE.set(date, { data: json, t: Date.now() });
      return json;
    } catch(e){
      NEGATIVE_CACHE.add(date);
      return null;
    }
  }
}

/* ============================================================
   MAIN FETCH (latest)
============================================================ */
async function fetchData(force){
  force = force || false;
  const now = Date.now();

  if(!force && raw && (now - lastFetch) < CONFIG.cacheTTL) return raw;
  if(fetching) return raw;

  fetching = true;

  try {
    const json = await fetchLatest();

    if(!json || !json.data){
      throw new Error('ساختار نامعتبر');
    }

    const out = {};
    for(const k in json.data){
      out[k] = normalize(k, json.data[k]);
    }

    raw = json;
    norm = out;
    lastFetch = now;
    lastError = null;
    fallback = false;

    console.log('[API] ✅ ' + Object.keys(out).length + ' نماد از ' + currentSource);
    saveLocal();
    notify();
    return json;

  } catch(err){
    lastError = err.message;
    console.warn('[API] ❌', err.message);

    if(raw) return raw;
    if(loadLocal()){ notify(); return { data:{} }; }

    const fb = makeFallback();
    raw = fb;
    norm = {};
    for(const k in fb.data) norm[k] = normalize(k, fb.data[k]);
    lastFetch = Date.now();
    fallback = true;
    notify();
    return fb;

  } finally {
    fetching = false;
  }
}

/* ============================================================
   ACCESSORS
============================================================ */
function get(k){ return norm[k] || null; }

function getById(id){
  const a = window.DATA.find(id);
  if(!a) return null;
  return get(a.tgju);
}

function getAll(){ return norm; }
function getLastFetch(){ return lastFetch; }
function getLastError(){ return lastError; }
function isFallback(){ return fallback; }
function getSource(){ return currentSource; }

function subscribe(fn){
  subs.add(fn);
  return function(){ subs.delete(fn); };
}

function notify(){
  subs.forEach(function(fn){
    try { fn(raw); } catch(e){}
  });
}

function start(ms){
  stop();
  const interval = ms || CONFIG.poll;
  if(loadLocal()) notify();
  fetchData().catch(function(){});
  // پیش‌بارگذاری annual
  fetchAnnual().catch(function(){});
  timer = setInterval(function(){
    if(document.hidden) return;
    fetchData().catch(function(){});
  }, interval);
  console.log('[API] ▶ ' + interval + 'ms — ' + currentSource);
}

function stop(){
  if(timer){ clearInterval(timer); timer = null; }
}

/* ============================================================
   HISTORY
============================================================ */
function today(){
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const tehranTime = new Date(now.getTime() + tehranOffset);
  return tehranTime.toISOString().slice(0, 10);
}

/**
 * تاریخچه یک نماد
 * اول از annual-history.json (۳۰ روز کامل)
 * بعد از history/ روزانه (پشتیبان)
 * 
 * @param {Object} asset
 * @param {number} days - تعداد روز (پیش‌فرض ۳۰)
 * @returns {Promise<Array>} - آرایه {t, p, h, l, o, d, dp, pd, gd}
 */
async function getHistory(asset, days){
  if(!asset) return [];
  days = Math.max(1, Math.ceil(days || 30));

  // ═══ تلاش اول: annual-history.json ═══
  try {
    const annual = await fetchAnnual();
    
    if(annual && annual.symbols && annual.symbols[asset.tgju]){
      const symbolData = annual.symbols[asset.tgju];
      
      // تبدیل به فرمت استاندارد
      const converted = symbolData.map(item => ({
        t: parseGregorianDate(item.gd) || Date.now(),
        p: item.p,
        h: item.h,
        l: item.l,
        o: item.o,
        d: item.d,
        dp: item.dp,
        pd: item.pd,
        gd: item.gd
      })).filter(x => x.p != null);
      
      // مرتب‌سازی صعودی (قدیمی‌ترین اول)
      converted.sort((a, b) => a.t - b.t);
      
      if(converted.length >= 2){
        // برگرداندن days روز آخر
        return converted.slice(-days);
      }
    }
  } catch(err){
    console.warn('[API] annual history failed:', err.message);
  }

  // ═══ تلاش دوم: history/ روزانه ═══
  const dates = [];
  const now = new Date();

  for(let i = 0; i < Math.min(days, 30); i++){
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const tehranOffset = 3.5 * 60 * 60 * 1000;
    const tehranTime = new Date(d.getTime() + tehranOffset);
    dates.push(tehranTime.toISOString().slice(0, 10));
  }

  const allPoints = [];

  for(const date of dates){
    const history = await fetchHistory(date);
    if(!history || !history.symbols) continue;

    const points = history.symbols[asset.tgju];
    if(points && points.length){
      allPoints.push(...points.map(p => ({
        t: p.t,
        p: p.p,
        dp: p.dp
      })));
    }
  }

  allPoints.sort((a, b) => a.t - b.t);
  return allPoints;
}

/**
 * فقط قیمت‌ها (برای نمودار)
 */
async function getHistoryPrices(asset, days){
  const history = await getHistory(asset, days);
  return history.map(h => h.p);
}

/**
 * پیدا کردن نزدیک‌ترین قیمت به یک زمان مشخص
 * @param {Object} asset
 * @param {number} msAgo - چند میلی‌ثانیه قبل
 * @returns {Promise<Object|null>} - {t, p, d, dp, ...}
 */
async function getPriceAt(asset, msAgo){
  // بازه مورد نیاز (چند روز)
  const days = Math.max(1, Math.ceil(msAgo / (24 * 60 * 60 * 1000)) + 1);
  const history = await getHistory(asset, days);
  
  if(!history || !history.length) return null;

  const targetTime = Date.now() - msAgo;
  let closest = null;
  let minDiff = Infinity;

  for(const point of history){
    const diff = Math.abs(point.t - targetTime);
    if(diff < minDiff){
      minDiff = diff;
      closest = point;
    }
  }

  // فقط اگر نزدیک باشه (حداکثر ۳ روز اختلاف)
  if(closest && minDiff < 3 * 24 * 60 * 60 * 1000){
    return closest;
  }
  return null;
}

/**
 * تاریخچه ساده (cache-based) — برای sparkline
 */
function history(asset, count, period){
  const live = getById(asset.id);
  const base = live && live.price != null ? live.price : 1000;

  const real = getCachedHistory(asset.tgju);
  if(real && real.length >= 2){
    return real.map(h => h.p);
  }

  // fallback: داده مصنوعی
  const seed = (asset.id + (period || '1D')).split('').reduce(function(a, c){
    return a + c.charCodeAt(0);
  }, 0);
  let s = seed;
  const rand = function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  let v = base * 0.94;
  const cnt = count || 60;
  for(let i = 0; i < cnt; i++){
    v += (rand() - 0.45) * base * 0.012;
    out.push(v);
  }
  out[out.length - 1] = base;
  return out;
}

function getCachedHistory(tgju){
  const todayStr = today();
  const cached = HISTORY_CACHE.get(todayStr);
  if(!cached) return null;
  const points = cached.data.symbols[tgju];
  return points || null;
}

async function preloadTodayHistory(){
  const date = today();
  await fetchHistory(date);
  console.log('[API] ✅ تاریخچه امروز preload شد');
}

/* ============================================================
   FALLBACK
============================================================ */
function makeFallback(){
  const now = Date.now();
  const t = new Date(now).toLocaleTimeString('fa-IR', { hour:'2-digit', minute:'2-digit' });
  const base = {
    geram18: 241246000, geram24: 321658000, mesghal: 1044990000,
    sekeb: 2360750000, sekee: 2400100000, nim: 1230000000,
    rob: 650000000, gerami: 340000000, ons: 4261.39,
    price_dollar_rl: 2346150, price_eur: 2671400,
    price_gbp: 3105800, price_aed: 639000, price_try: 48965,
    price_cny: 351500, price_jpy: 1491000, price_cad: 1660400,
    price_aud: 1651800, price_chf: 2837000, price_rub: 27680,
    price_sar: 624690, price_kwd: 7616200, price_iqd: 1503,
    price_afn: 37350, silver: 63.41, platinum: 1745,
    palladium: 1276.5, copper: 13632.97, aluminium: 3255.63,
    oil: 81.73, oil_brent: 106.747, energy_natural_gas: 3.2873,
    'crypto-bitcoin': 84031.56, 'crypto-ethereum': 2669.46,
    'crypto-tether': 1, 'crypto-binance-coin': 778.41,
    'crypto-ripple': 1.53, 'crypto-cardano': 0.24625904,
    'crypto-solana': 116.72, 'crypto-dogecoin': 0.09592597,
    'crypto-litecoin': 71.64, 'crypto-polkadot': 1.16,
    commodity_us_wheat: 704.84, commodity_corn: 526.13,
    commodity_us_sugar_no11: 18.65, commodity_us_coffee_c: 276.46,
    bourse: 7257043.4, dow_jones_us: 52900.07,
    nasdaq_us: 25832.67, s_p_500_us: 7483.24,
    tether_gold_xaut: 4265.4
  };

  const data = {};
  for(const k in base){
    const p = base[k];
    const abs = Math.abs(p);
    const dec = abs < 10 ? 6 : (abs < 1000 ? 2 : 0);
    data[k] = {
      p: p,
      h: p * 1.02,
      l: p * 0.98,
      d: 0,
      dp: 0,
      t: t,
      ts: new Date(now).toISOString().slice(0, 19).replace('T', ' ')
    };
  }

  return {
    updated: new Date(now).toISOString(),
    updatedTehran: t,
    count: Object.keys(data).length,
    data: data,
    __fallback: true
  };
}

/* ============================================================
   EXPORT
============================================================ */
return {
  CFG: CONFIG,
  fetchData: fetchData,
  start: start,
  stop: stop,
  get: get,
  getById: getById,
  getAll: getAll,
  getLastFetch: getLastFetch,
  getLastError: getLastError,
  isFallback: isFallback,
  getSource: getSource,
  subscribe: subscribe,
  history: history,
  getHistory: getHistory,
  getHistoryPrices: getHistoryPrices,
  getPriceAt: getPriceAt,
  fetchAnnual: fetchAnnual,
  preloadTodayHistory: preloadTodayHistory,
  clearHistoryCache: function(){
    HISTORY_CACHE.clear();
    annualCache = null;
    annualCacheTime = 0;
  }
};

})();
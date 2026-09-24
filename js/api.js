/**
 * قیمتو 5.1 — API
 */
window.API = (function(){
'use strict';

const ENDPOINTS = [
  'https://call2.tgju.org/ajax.json',
  'https://call.tgju.org/ajax.json',
  'https://call3.tgju.org/ajax.json'
];

const CFG = {
  timeout: 8000,
  cacheTTL: 15000,
  poll: 20000,
  retries: 2
};

let raw = null;
let norm = {};
let lastFetch = 0;
let lastError = null;
let fetching = false;
let fallback = false;
let timer = null;
let subs = new Set();
let endpointIdx = 0;

/* ===== HISTORY ===== */
const HISTORY_KEY = 'gheymato.history.v5';
const HISTORY_MAX = 100;

function saveToHistory(){
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    const now = Date.now();
    const timeStr = new Date().toISOString();

    for(const key in norm){
      const item = norm[key];
      if(!item || item.price == null) continue;

      if(!history[key]) history[key] = [];
      const last = history[key][history[key].length - 1];

      if(!last || last.p !== item.price){
        history[key].push({
          p: item.price,
          cp: item.changePercent || 0,
          t: now,
          d: timeStr
        });

        if(history[key].length > HISTORY_MAX){
          history[key] = history[key].slice(-HISTORY_MAX);
        }
      }
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch(e){}
}

function getHistory(tgjuKey){
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    return h[tgjuKey] || [];
  } catch(e){ return []; }
}

/* ===== HELPERS ===== */
function cleanNum(v){
  if(v == null || v === '') return null;
  const s = String(v).replace(/,/g,'').replace(/\s+/g,'').replace(/\t/g,'').trim();
  if(!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalize(key, item){
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

/* ===== LOCAL CACHE ===== */
const LCKEY = 'gheymato.last.v5';

function saveLocal(){
  try {
    if(norm && Object.keys(norm).length){
      localStorage.setItem(LCKEY, JSON.stringify({
        d: norm,
        t: lastFetch,
        ep: endpointIdx
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

/* ===== FETCH ===== */
async function fetchJSON(url, attempt){
  attempt = attempt || 0;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(function(){ ctrl.abort(); }, CFG.timeout);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(tid);

    if(!res.ok) throw new Error('HTTP ' + res.status);
    const txt = await res.text();
    if(txt.length < 100) throw new Error('پاسخ کوچک');
    return JSON.parse(txt);

  } catch(err){
    if(attempt < CFG.retries){
      await new Promise(function(r){ setTimeout(r, 800 * (attempt + 1)); });
      return fetchJSON(url, attempt + 1);
    }
    throw err;
  }
}

async function fetchWithFailover(){
  const start = endpointIdx;
  let lastErr;

  for(let i = 0; i < ENDPOINTS.length; i++){
    const idx = (start + i) % ENDPOINTS.length;
    try {
      const url = ENDPOINTS[idx] + '?_=' + Date.now();
      const json = await fetchJSON(url);
      endpointIdx = idx;
      return json;
    } catch(err){
      lastErr = err;
    }
  }
  throw lastErr;
}

async function fetchData(force){
  force = force || false;
  const now = Date.now();
  if(!force && raw && (now - lastFetch) < CFG.cacheTTL) return raw;
  if(fetching) return raw;

  fetching = true;

  try {
    const json = await fetchWithFailover();
    if(!json || !json.current) throw new Error('ساختار نامعتبر');

    const out = {};
    for(const k in json.current) out[k] = normalize(k, json.current[k]);

    if(Object.keys(norm).length > 0) saveToHistory();

    raw = json;
    norm = out;
    lastFetch = now;
    lastError = null;
    fallback = false;

    console.log('[API] ✅ ' + Object.keys(out).length + ' نماد');
    saveLocal();
    notify();
    return json;

  } catch(err){
    lastError = err.message;
    console.warn('[API] ❌', err.message);

    if(raw) return raw;
    if(loadLocal()){ notify(); return {current:{}}; }

    const fb = makeFallback();
    raw = fb;
    norm = {};
    for(const k in fb.current) norm[k] = normalize(k, fb.current[k]);
    lastFetch = Date.now();
    fallback = true;
    notify();
    return fb;

  } finally {
    fetching = false;
  }
}

/* ===== ACCESSORS ===== */
function get(k){ return norm[k] || null; }
function getById(id){
  const a = window.DATA.find(id);
  return a ? get(a.tgju) : null;
}
function getAll(){ return norm; }
function getLastFetch(){ return lastFetch; }
function getLastError(){ return lastError; }
function isFallback(){ return fallback; }
function getEndpoint(){ return ENDPOINTS[endpointIdx]; }

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
  const interval = ms || CFG.poll;
  if(loadLocal()) notify();
  fetchData().catch(function(){});
  timer = setInterval(function(){
    if(document.hidden) return;
    fetchData().catch(function(){});
  }, interval);
  console.log('[API] ▶ ' + interval + 'ms — ' + getEndpoint());
}

function stop(){
  if(timer){ clearInterval(timer); timer = null; }
}

function getAssetHistory(id){
  const asset = window.DATA.find(id);
  if(!asset) return [];
  return getHistory(asset.tgju);
}

function clearHistory(){
  try { localStorage.removeItem(HISTORY_KEY); } catch(e){}
}

function history(asset, count, period){
  if(!asset) return [];
  const real = getAssetHistory(asset.id);
  if(real && real.length >= 2){
    return real.map(function(h){ return h.p; });
  }
  const live = getById(asset.id);
  const base = live && live.price != null ? live.price : 1000;
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

function makeFallback(){
  const now = Date.now();
  const t = new Date(now).toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'});
  const base = {
    geram18: 240422000, geram24: 320559000, gold_17: 1042486000,
    mesghal: 1041480000,
    sekeb: 2361300000, sekee: 2400050000, nim: 1230000000,
    rob: 650000000, gerami: 340000000, ons: 4259.73,
    price_dollar_rl: 2343200, price_eur: 2669000, price_gbp: 3101700,
    price_aed: 638260, price_try: 48865, price_cny: 351100,
    price_jpy: 1491000, price_cad: 1660100, price_aud: 1649200,
    price_chf: 2836300, price_rub: 27560, price_sar: 623970,
    price_kwd: 7605100, price_iqd: 1501, price_afn: 37640,
    silver: 63.64, platinum: 1749.40, palladium: 1270.00,
    copper: 13632.97, aluminium: 3257.4,
    oil: 81.73, oil_brent: 104.796, energy_natural_gas: 3.0568,
    'crypto-bitcoin': 83582.81, 'crypto-ethereum': 2650.29,
    'crypto-tether': 1, 'crypto-binance-coin': 770.29,
    'crypto-ripple': 1.47, 'crypto-cardano': 0.2367,
    'crypto-solana': 113.38, 'crypto-dogecoin': 0.0001,
    'crypto-litecoin': 66.63, 'crypto-polkadot': 1.12,
    commodity_us_wheat: 704.3, commodity_corn: 528.5,
    commodity_us_sugar_no11: 18.76, commodity_us_coffee_c: 273.13,
    bourse: 7257043, dow_jones_us: 52900.07,
    nasdaq_us: 25832.67, s_p_500_us: 7483.24
  };

  const current = {};
  for(const k in base){
    const p = base[k];
    const j = 1 + (Math.random() - 0.5) * 0.002;
    const np = p * j;
    const d = np - p;
    const dp = (d / p) * 100;
    const abs = Math.abs(p);
    const dec = abs < 10 ? 6 : (abs < 1000 ? 2 : 0);

    current[k] = {
      p: np.toFixed(dec),
      h: (np * 1.02).toFixed(dec),
      l: (np * 0.98).toFixed(dec),
      d: d.toFixed(dec),
      dp: parseFloat(dp.toFixed(2)),
      t: t,
      ts: new Date(now).toISOString().slice(0,19).replace('T',' ')
    };
  }
  return { current: current, __fallback: true };
}

return {
  CFG: CFG,
  ENDPOINTS: ENDPOINTS,
  fetchData: fetchData,
  start: start,
  stop: stop,
  get: get,
  getById: getById,
  getAll: getAll,
  getLastFetch: getLastFetch,
  getLastError: getLastError,
  isFallback: isFallback,
  getEndpoint: getEndpoint,
  subscribe: subscribe,
  getAssetHistory: getAssetHistory,
  clearHistory: clearHistory,
  history: history
};

})();
/**
 * قیمتو 5.5 — CORE
 * Data + Config + Storage + Utils
 * ✅ همیشه تومان
 * ✅ polling ۶۰ ثانیه
 * ✅ بدون unit toggle
 */
(function(){
'use strict';

/* ============================================================
   CONFIG
============================================================ */
const CFG_KEY = 'gheymato.cfg.v5';
const CFG_DEFAULTS = {
  theme:'dark',
  showChange:true,
  showSparkline:true,
  autoRefresh:true,
  refreshInterval:60000,
  chartPeriod:'1D',
  currency:'toman'
};

const CFG = {
  _c: null,
  load(){
    try {
      const raw = localStorage.getItem(CFG_KEY);
      this._c = raw ? {...CFG_DEFAULTS, ...JSON.parse(raw)} : {...CFG_DEFAULTS};
    } catch(e){ this._c = {...CFG_DEFAULTS}; }
    return this._c;
  },
  save(){ try { localStorage.setItem(CFG_KEY, JSON.stringify(this._c)); } catch(e){} },
  get(k){ if(!this._c) this.load(); return this._c[k]; },
  set(k,v){ if(!this._c) this.load(); this._c[k] = v; this.save(); },
  reset(){ this._c = {...CFG_DEFAULTS}; this.save(); }
};

/* ============================================================
   STORAGE
============================================================ */
const SKEY = {
  FAV:'gheymato.favs.v5',
  ALERTS:'gheymato.alerts.v5',
  PF:'gheymato.pf.v5',
  NOTES:'gheymato.notes.v5'
};

const Storage = {
  get(key, fb){ try { const r = localStorage.getItem(key); return r == null ? fb : JSON.parse(r); } catch(e){ return fb; } },
  set(key, v){ try { localStorage.setItem(key, JSON.stringify(v)); } catch(e){} },
  remove(key){ try { localStorage.removeItem(key); } catch(e){} },
  clear(){ Object.values(SKEY).forEach(k => { try{ localStorage.removeItem(k); }catch(e){} }); },

  fav: {
    get: () => Storage.get(SKEY.FAV, ['gold18','coin','dollar','euro','btc']),
    save: (a) => Storage.set(SKEY.FAV, a),
    toggle(id){
      const l = this.get();
      const i = l.indexOf(id);
      if(i === -1) l.push(id); else l.splice(i,1);
      this.save(l);
      return l;
    }
  },
  alerts: {
    get: () => Storage.get(SKEY.ALERTS, []),
    save: (a) => Storage.set(SKEY.ALERTS, a)
  },
  pf: {
    get: () => Storage.get(SKEY.PF, []),
    save: (a) => Storage.set(SKEY.PF, a)
  },
  notes: {
    get: () => Storage.get(SKEY.NOTES, ''),
    save: (v) => Storage.set(SKEY.NOTES, v)
  }
};

/* ============================================================
   UTILS
============================================================ */
const U = {
  $: (s, c=document) => c.querySelector(s),
  $$: (s, c=document) => Array.from(c.querySelectorAll(s)),

  num(v, d=0){
    if(v == null || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d});
  },

  /**
   * ✅ همیشه تومان — بدون toggle
   * ورودی از API به ریال هست، تقسیم بر ۱۰
   */
  money(v){
    if(v == null || isNaN(v)) return '—';
    const val = Math.round(v / 10); // ریال → تومان
    const abs = Math.abs(val);
    const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
    return this.num(val, d) + ' تومان';
  },

  price(asset, v){
    if(v == null || isNaN(v)) return '—';
    if(asset.ptype === 'usd') return '$' + this.num(v, asset.dec);
    return this.money(v);
  },

  time(d = new Date()){
    return new Date(d).toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  },

  esc(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  },

  flag(code){ return `https://flagcdn.com/w80/${code}.png`; },

  debounce(fn, w=150){
    let t;
    return function(...args){ clearTimeout(t); t = setTimeout(() => fn.apply(this,args), w); };
  }
};

/* ============================================================
   EXPORT
============================================================ */
window.CFG = CFG;
window.Storage = Storage;
window.U = U;

})();
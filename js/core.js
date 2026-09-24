/**
 * قیمتو 4.0 — CORE
 * Data + Config + Storage + Utils
 */
(function(){
'use strict';

/* ============================================================
   CATEGORIES
============================================================ */
const CATEGORIES = {
  gold:      {label:'طلا و سکه', icon:'coins',     color:'gold'},
  currency:  {label:'ارز',       icon:'dollarSign',color:'blue'},
  metal:     {label:'فلزات',     icon:'diamond',   color:'purple'},
  energy:    {label:'انرژی',     icon:'zap',       color:'orange'},
  crypto:    {label:'کریپتو',    icon:'bitcoin',   color:'orange'},
  commodity: {label:'کالا',      icon:'briefcase', color:'green'},
  index:     {label:'شاخص',      icon:'barChart',  color:'cyan'}
};

/* ============================================================
   ASSETS
============================================================ */
const ASSETS = [
  {id:'gold18',    tgju:'geram18',       name:'طلای ۱۸ عیار',   short:'طلای ۱۸',  code:'GOLD18', cat:'gold', ptype:'rial', unit:'گرم',  dec:0, icon:'coins'},
  {id:'gold24',    tgju:'geram24',       name:'طلای ۲۴ عیار',   short:'طلای ۲۴',  code:'GOLD24', cat:'gold', ptype:'rial', unit:'گرم',  dec:0, icon:'coins'},
  {id:'mesghal',   tgju:'mesghal',       name:'مثقال طلا',      short:'مثقال',    code:'MESGHAL',cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'coin',      tgju:'sekeb',         name:'سکه امامی',       short:'سکه امامی',code:'COIN',   cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'coin_bahar',tgju:'sekee',         name:'سکه بهار آزادی', short:'بهار',     code:'BAHAR',  cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'nim',       tgju:'nim',           name:'نیم سکه',         short:'نیم سکه',  code:'NIM',    cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'rob',       tgju:'rob',           name:'ربع سکه',         short:'ربع سکه',  code:'ROB',    cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'gerami',    tgju:'gerami',        name:'سکه گرمی',        short:'گرمی',     code:'GERAMI', cat:'gold', ptype:'rial', unit:'عدد',  dec:0, icon:'coins'},
  {id:'ounce',     tgju:'ons',           name:'انس طلا',         short:'انس',      code:'XAU',    cat:'gold', ptype:'usd',  unit:'اونس', dec:2, icon:'coins'},

  {id:'dollar',  tgju:'price_dollar_rl', name:'دلار آمریکا',  short:'دلار',    code:'USD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'us'},
  {id:'euro',    tgju:'price_eur',       name:'یورو',          short:'یورو',    code:'EUR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'eu'},
  {id:'pound',   tgju:'price_gbp',       name:'پوند انگلیس',  short:'پوند',    code:'GBP', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'gb'},
  {id:'dirham',  tgju:'price_aed',       name:'درهم امارات',  short:'درهم',    code:'AED', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ae'},
  {id:'try_',    tgju:'price_try',       name:'لیر ترکیه',     short:'لیر',     code:'TRY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'tr'},
  {id:'cny',     tgju:'price_cny',       name:'یوان چین',      short:'یوان',    code:'CNY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'cn'},
  {id:'jpy',     tgju:'price_jpy',       name:'ین ژاپن',       short:'ین',      code:'JPY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'jp'},
  {id:'cad',     tgju:'price_cad',       name:'دلار کانادا',   short:'کانادا',  code:'CAD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ca'},
  {id:'aud',     tgju:'price_aud',       name:'دلار استرالیا', short:'استرالیا',code:'AUD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'au'},
  {id:'chf',     tgju:'price_chf',       name:'فرانک سوئیس',  short:'فرانک',   code:'CHF', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ch'},
  {id:'rub',     tgju:'price_rub',       name:'روبل روسیه',    short:'روبل',    code:'RUB', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ru'},
  {id:'sar',     tgju:'price_sar',       name:'ریال سعودی',   short:'سعودی',   code:'SAR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'sa'},
  {id:'kwd',     tgju:'price_kwd',       name:'دینار کویت',   short:'کویت',    code:'KWD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'kw'},
  {id:'iqd',     tgju:'price_iqd',       name:'دینار عراق',   short:'عراق',    code:'IQD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'iq'},
  {id:'afn',     tgju:'price_afn',       name:'افغانی',        short:'افغانی',  code:'AFN', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'af'},

  {id:'silver',      tgju:'silver',      name:'نقره (اونس)', short:'نقره',     code:'XAG', cat:'metal', ptype:'usd',  unit:'اونس', dec:2, icon:'diamond'},
  {id:'platinum',    tgju:'platinum',    name:'پلاتین',       short:'پلاتین',   code:'XPT', cat:'metal', ptype:'usd',  unit:'اونس', dec:2, icon:'diamond'},
  {id:'palladium',   tgju:'palladium',   name:'پالادیوم',     short:'پالادیوم', code:'XPD', cat:'metal', ptype:'usd',  unit:'اونس', dec:2, icon:'diamond'},
  {id:'copper',      tgju:'copper',      name:'مس',           short:'مس',       code:'XCU', cat:'metal', ptype:'usd',  unit:'تن',   dec:2, icon:'diamond'},
  {id:'aluminium',   tgju:'aluminium',   name:'آلومینیوم',    short:'آلومینیوم',code:'ALU', cat:'metal', ptype:'usd',  unit:'تن',   dec:2, icon:'diamond'},

  {id:'oil',         tgju:'oil',              name:'نفت WTI',    short:'WTI',    code:'WTI',   cat:'energy', ptype:'usd', unit:'بشکه', dec:2, icon:'zap'},
  {id:'oil_brent',   tgju:'oil_brent',        name:'نفت برنت',   short:'برنت',   code:'BRENT', cat:'energy', ptype:'usd', unit:'بشکه', dec:3, icon:'zap'},
  {id:'gas',         tgju:'energy_natural_gas',name:'گاز طبیعی', short:'گاز',    code:'NG',    cat:'energy', ptype:'usd', unit:'MMBtu',dec:3, icon:'zap'},

  {id:'btc',   tgju:'crypto-bitcoin',       name:'بیت‌کوین',   short:'بیت‌کوین',  code:'BTC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, icon:'bitcoin'},
  {id:'eth',   tgju:'crypto-ethereum',      name:'اتریوم',     short:'اتریوم',    code:'ETH', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, icon:'ethereum'},
  {id:'usdt',  tgju:'crypto-tether',        name:'تتر',        short:'تتر',       code:'USDT',cat:'crypto', ptype:'usd', unit:'عدد', dec:4, icon:'tether'},
  {id:'bnb',   tgju:'crypto-binance-coin',  name:'بایننس کوین',short:'BNB',       code:'BNB', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, icon:'bitcoin'},
  {id:'xrp',   tgju:'crypto-ripple',        name:'ریپل',       short:'ریپل',      code:'XRP', cat:'crypto', ptype:'usd', unit:'عدد', dec:4, icon:'bitcoin'},
  {id:'ada',   tgju:'crypto-cardano',       name:'کاردانو',    short:'کاردانو',   code:'ADA', cat:'crypto', ptype:'usd', unit:'عدد', dec:4, icon:'bitcoin'},
  {id:'sol',   tgju:'crypto-solana',        name:'سولانا',     short:'سولانا',    code:'SOL', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, icon:'bitcoin'},
  {id:'doge',  tgju:'crypto-dogecoin',      name:'دوج‌کوین',   short:'دوج',       code:'DOGE',cat:'crypto', ptype:'usd', unit:'عدد', dec:6, icon:'bitcoin'},
  {id:'ltc',   tgju:'crypto-litecoin',      name:'لایت‌کوین',  short:'لایت‌کوین', code:'LTC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, icon:'bitcoin'},
  {id:'dot',   tgju:'crypto-polkadot',      name:'پولکادات',   short:'پولکادات',  code:'DOT', cat:'crypto', ptype:'usd', unit:'عدد', dec:4, icon:'bitcoin'},

  {id:'wheat',   tgju:'commodity_us_wheat',    name:'گندم',  short:'گندم',  code:'WHEAT', cat:'commodity', ptype:'usd', unit:'بوشل', dec:2, icon:'briefcase'},
  {id:'corn',    tgju:'commodity_corn',        name:'ذرت',   short:'ذرت',   code:'CORN',  cat:'commodity', ptype:'usd', unit:'بوشل', dec:2, icon:'briefcase'},
  {id:'sugar',   tgju:'commodity_us_sugar_no11',name:'شکر',  short:'شکر',   code:'SUGAR', cat:'commodity', ptype:'usd', unit:'پوند', dec:2, icon:'briefcase'},
  {id:'coffee',  tgju:'commodity_us_coffee_c', name:'قهوه',  short:'قهوه',  code:'COFFEE',cat:'commodity', ptype:'usd', unit:'پوند', dec:2, icon:'briefcase'},

  {id:'bourse',  tgju:'bourse',       name:'بورس تهران', short:'بورس',    code:'TSE', cat:'index', ptype:'rial', unit:'واحد', dec:0, icon:'barChart'},
  {id:'dowjones',tgju:'dow_jones_us', name:'داو جونز',   short:'داو جونز',code:'DJI', cat:'index', ptype:'usd',  unit:'واحد', dec:2, icon:'barChart'},
  {id:'nasdaq',  tgju:'nasdaq_us',    name:'نزدک',       short:'نزدک',    code:'IXIC',cat:'index', ptype:'usd',  unit:'واحد', dec:2, icon:'barChart'},
  {id:'sp500',   tgju:'s_p_500_us',   name:'S&P 500',    short:'S&P',     code:'SPX', cat:'index', ptype:'usd',  unit:'واحد', dec:2, icon:'barChart'}
];

const BY_ID = {};
const BY_TGJU = {};
ASSETS.forEach(a => { BY_ID[a.id] = a; BY_TGJU[a.tgju] = a; });

const FEATURED = ['gold18','coin','dollar','euro','ounce','mesghal','btc','eth'];
const MOST_USED = ['gold18','dollar','coin','ounce','euro','btc','usdt','silver'];

/* ============================================================
   CONFIG
============================================================ */
const CFG_KEY = 'gheymato.cfg.v4';
const CFG_DEFAULTS = {
  currency:'toman',
  theme:'dark',
  showChange:true,
  showSparkline:true,
  autoRefresh:true,
  refreshInterval:20000,
  chartPeriod:'1D'
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
  FAV:'gheymato.favs.v4',
  ALERTS:'gheymato.alerts.v4',
  PF:'gheymato.pf.v4',
  NOTES:'gheymato.notes.v4'
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

  rial(v){ return v == null ? null : Math.round(v / 10); },

  money(v){
    if(v == null || isNaN(v)) return '—';
    const val = CFG.get('currency') === 'toman' ? Math.round(v/10) : v;
    const abs = Math.abs(val);
    const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
    const unit = CFG.get('currency') === 'toman' ? 'تومان' : 'ریال';
    return this.num(val, d) + ' ' + unit;
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
window.DATA = {
  CATEGORIES, ASSETS, FEATURED, MOST_USED,
  find: (id) => BY_ID[id] || null,
  byTgju: (k) => BY_TGJU[k] || null,
  byCat: (c) => ASSETS.filter(a => a.cat === c),
  countByCat: () => {
    const o = {};
    Object.keys(CATEGORIES).forEach(c => o[c] = 0);
    ASSETS.forEach(a => o[a.cat] = (o[a.cat] || 0) + 1);
    return o;
  }
};
window.CFG = CFG;
window.Storage = Storage;
window.U = U;

})();
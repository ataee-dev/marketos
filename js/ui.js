/**
 * قیمتو 7.1 — UI (نسخه کامل اصلاح‌شده)
 * ✅ حذف Hero Slider و جایگزینی با Live Strip
 * ✅ Sparkline روی همه کارت‌ها
 * ✅ حالت Grid / List برای بازارها
 * ✅ Lazy loading با IntersectionObserver
 * ✅ انیمیشن‌های نرم و بهینه
 * ✅ جستجوی ترکیبی (نماد + خودرو)
 */

window.UI = (function(){
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ═══════════════ STATE ═══════════════ */
let filter = 'all';
let search = '';
let currentPage = 'home';
let activeChartId = 'gold18';
let carsFilter = 'all';
let carsSearch = '';
let marketView = 'grid'; /* 'grid' | 'list' */

const PAGES = ['home', 'markets', 'chart', 'compare', 'favorites', 'cars', 'settings'];

/* ═══════════════ SPARKLINE OBSERVER ═══════════════ */
let _sparkObserver = null;

/* ============================================================
   GESTURES — غیرفعال‌سازی کامل swipe/zoom
============================================================ */
function disableAllGestures(){
  const opts = { passive: false };

  document.addEventListener('gesturestart', e => e.preventDefault(), opts);
  document.addEventListener('gesturechange', e => e.preventDefault(), opts);
  document.addEventListener('gestureend', e => e.preventDefault(), opts);

  document.addEventListener('touchstart', e => {
    if(e.touches.length > 1) e.preventDefault();
  }, opts);

  let startX = 0, startY = 0;

  document.addEventListener('touchstart', e => {
    if(e.touches.length === 1){
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if(e.touches.length > 1){ e.preventDefault(); return; }

    const inScrollable = e.target.closest(
      '.scroll-row, .tools-horizontal, .chips, .pills, .hdr-ticker, .live-strip, .mobile-nav'
    );
    if(inScrollable) return;

    if(e.target.closest('.sidebar, .modal, .tv, input, textarea, select')) return;

    if(e.touches[0]){
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if(dx > dy && dx > 10) e.preventDefault();
    }
  }, opts);

  let lastTouch = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if(now - lastTouch <= 300){
      const inScrollable = e.target.closest('.scroll-row, .tools-horizontal, .chips, .pills, .hdr-ticker, .live-strip');
      if(!inScrollable) e.preventDefault();
    }
    lastTouch = now;
  }, opts);

  window.Gestures = {
    init: function(){},
    destroy: function(){},
    isActive: function(){ return false; }
  };
}

/* ============================================================
   NUMBER FORMATTING — اعداد فارسی
============================================================ */
function formatNumber(num, decimals){
  if(num == null || isNaN(num)) return '—';
  decimals = decimals || 0;
  const fixed = Number(num).toFixed(decimals);
  const parts = fixed.split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  const sign = intPart.startsWith('-') ? '-' : '';
  const absInt = intPart.replace('-', '');
  const withCommas = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let result = sign + withCommas;
  if(decPart) result += '.' + decPart;
  return result.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function parseFormattedNumber(str){
  if(str == null) return null;
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  let s = String(str)
    .replace(/[۰-۹]/g, d => persian.indexOf(d))
    .replace(/[٠-٩]/g, d => arabic.indexOf(d));
  s = s.replace(/[^\d.\-]/g, '');
  if(!s || s === '-' || s === '.') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/* ============================================================
   ICON HELPERS
============================================================ */
const CAT_COLOR = {
  gold: 'gold',
  currency: 'blue',
  metal: 'purple',
  energy: 'orange',
  crypto: 'orange',
  commodity: 'green',
  index: 'cyan',
  goldCrypto: 'gold',
  ratio: 'purple'
};

function assetIcon(asset){
  if(!asset) return '';
  if(window.Icons && window.Icons.assetSVG) return window.Icons.assetSVG(asset);
  return window.Icons ? window.Icons.get('barChart') : '';
}

function catColor(asset){ return CAT_COLOR[asset.cat] || 'gold'; }

/* ============================================================
   UNIT SYSTEM
============================================================ */
function getUnit(){ return window.CFG.get('currency') || 'toman'; }

function userToBase(value){
  if(value == null || isNaN(value)) return null;
  return getUnit() === 'toman' ? value * 10 : value;
}

function baseToUser(value){
  if(value == null || isNaN(value)) return null;
  return getUnit() === 'toman' ? value / 10 : value;
}

function unitLabel(){ return getUnit() === 'toman' ? 'تومان' : 'ریال'; }

function fullUnitLabel(asset){
  if(!asset) return '';
  const unit = asset.unit || '';
  if(asset.ptype === 'usd') return unit ? '$/' + unit : '$';
  const money = unitLabel();
  return unit ? money + '/' + unit : money;
}

function formatPrice(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';
  if(asset && asset.ptype === 'usd'){
    const dec = asset.dec != null ? asset.dec : 2;
    return '$' + formatNumber(rialValue, dec);
  }
  const val = baseToUser(rialValue);
  const abs = Math.abs(val);
  const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
  return formatNumber(val, d) + ' ' + unitLabel();
}

function formatPriceWithUnit(asset, rialValue){
  if(rialValue == null) return '—';
  const price = formatPrice(asset, rialValue);
  const unit = asset && asset.unit ? ' / ' + asset.unit : '';
  return price + unit;
}

/* ============================================================
   MARKET CARD HTML — با اسپارک‌لاین
============================================================ */
function marketCardHTML(asset){
  const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
  const price = live && live.price != null ? live.price : null;
  const cp = live ? live.changePercent : null;
  const up = (cp || 0) >= 0;
  const color = catColor(asset);
  const isFav = window.Storage.fav.get().includes(asset.id);
  const noPrice = price == null;

  return `
    <article class="m-card ${noPrice ? 'm-card-empty' : ''}" data-card-id="${asset.id}" role="button" tabindex="${noPrice ? '-1' : '0'}">
      <div class="m-card-head">
        <div class="m-card-icon ${color}">${assetIcon(asset)}</div>
        <div class="m-card-info">
          <strong>${window.U.esc(asset.short || asset.name)}</strong>
          <small>${asset.code}</small>
        </div>
        <button type="button" class="icon-btn" data-fav-toggle="${asset.id}"
          style="width:22px;height:22px;color:${isFav?'var(--warn)':'var(--dim)'};flex-shrink:0;padding:0;background:none;border:0">
          ${window.Icons.get('star')}
        </button>
      </div>
      <div class="m-card-price">${noPrice ? '—' : formatPrice(asset, price)}</div>
      ${cp != null && !noPrice ? `
        <span class="m-card-change ${up?'up':'down'}">
          ${up?'▲':'▼'} ${Math.abs(cp).toFixed(2)}٪
        </span>
      ` : noPrice ? `
        <span class="m-card-change muted">بدون داده</span>
      ` : ''}
      ${!noPrice ? `
        <div class="m-card-spark">
          <canvas data-spark-canvas="${asset.id}"></canvas>
        </div>
      ` : ''}
    </article>
  `;
}

/* ============================================================
   LIVE STRIP — نوار قیمت‌های زنده (جایگزین Hero Slider)
============================================================ */
const LIVE_STRIP_IDS = ['dollar', 'gold18', 'coin', 'ounce', 'oil_brent', 'btc', 'mesghal', 'euro'];

function liveStripCardHTML(asset){
  const live = window.API.getById(asset.id);
  const price = live && live.price != null ? live.price : null;
  const cp = live ? live.changePercent : null;
  const up = (cp || 0) >= 0;
  const color = catColor(asset);
  const noPrice = price == null;

  return `
    <div class="live-strip-card ${noPrice ? 'm-card-empty' : (up ? 'is-up' : 'is-down')}"
         data-card-id="${asset.id}"
         role="button"
         tabindex="${noPrice ? '-1' : '0'}">
      <div class="live-strip-head">
        <div class="live-strip-icon ${color}">${assetIcon(asset)}</div>
        <div class="live-strip-info">
          <strong>${window.U.esc(asset.short || asset.name)}</strong>
          <small>${asset.code}</small>
        </div>
      </div>
      <div class="live-strip-price">${noPrice ? '—' : formatPrice(asset, price)}</div>
      ${cp != null && !noPrice ? `
        <span class="live-strip-change ${up ? 'up' : 'down'}">
          ${up ? '▲' : '▼'} ${Math.abs(cp).toFixed(2)}٪
        </span>
      ` : noPrice ? `
        <span class="live-strip-change muted">بدون داده</span>
      ` : ''}
      ${!noPrice ? `
        <div class="live-strip-spark">
          <canvas data-spark-canvas="${asset.id}"></canvas>
        </div>
      ` : ''}
    </div>
  `;
}

function renderLiveStrip(){
  const wrap = $('[data-live-strip]');
  if(!wrap) return;

  const assets = LIVE_STRIP_IDS.map(id => window.DATA.find(id)).filter(Boolean);
  if(!assets.length) return;

  wrap.innerHTML = assets.map(liveStripCardHTML).join('');

  /* ✅ رسم اسپارک‌لاین‌ها */
  drawAllSparklines(wrap);
}

/* ============================================================
   SPARKLINE — نمودار کوچک روی کارت‌ها
============================================================ */
async function drawSparkline(canvas, asset){
  try {
    /* ✅ تعیین رنگ بر اساس تغییر واقعی (changePercent) */
    const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
    const cp = live ? live.changePercent : null;
    const isUp = (cp || 0) >= 0;

    /* ✅ کش داده‌ها */
    const cacheKey = 'spark_' + asset.id;
    let prices = _sparkCache.get(cacheKey);

    if(!prices){
      const history = await window.API.getHistory(asset, 14);
      if(!history || history.length < 2) return;
      prices = history.map(h => h.p).filter(p => p != null);
      if(prices.length < 2) return;
      _sparkCache.set(cacheKey, prices);
    }

    const r = canvas.getBoundingClientRect();
    if(!r.width || !r.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;

    /* ✅ رنگ بر اساس جهت واقعی تغییر (نه اولین/آخرین قیمت) */
    const color = isUp ? '#10b981' : '#ef4444';
    const fillStart = isUp ? 'rgba(16,185,129,.30)' : 'rgba(239,68,68,.30)';

    const w = r.width;
    const h = r.height;
    const pad = 2;

    const pts = prices.map((p, i) => ({
      x: pad + (i / (prices.length - 1)) * (w - pad * 2),
      y: h - pad - ((p - min) / range) * (h - pad * 2)
    }));

    /* فیل گرادیانت */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fillStart);
    g.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i = 1; i < pts.length; i++){
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    /* خط */
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i = 1; i < pts.length; i++){
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    /* نقطه آخر با رنگ مربوطه */
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

  } catch(e){
    /* بی‌صدا */
  }
}

/* ✅ کش اسپارک‌لاین */
const _sparkCache = new Map();

/* ✅ رسم همه اسپارک‌لاین‌ها با Lazy Loading */
/* ✅ رسم همه اسپارک‌لاین‌ها با Lazy Loading مطمئن */
function drawAllSparklines(container){
  if(!container) return;

  const canvases = container.querySelectorAll('[data-spark-canvas]');
  if(!canvases.length) return;

  /* ✅ استفاده از requestAnimationFrame برای اطمینان از layout */
  requestAnimationFrame(() => {
    canvases.forEach(canvas => {
      const id = canvas.dataset.sparkCanvas;
      const asset = window.DATA.find(id);
      if(!asset) return;

      /* ✅ اگه canvas قابل دیدن باشه، فوری رسم کن */
      const rect = canvas.getBoundingClientRect();
      if(rect.width > 0 && rect.height > 0){
        drawSparkline(canvas, asset).catch(() => {});
      } else {
        /* ✅ در غیر این صورت با observer رصد کن */
        if(!_sparkObserver) initSparkObserver();
        _sparkObserver.observe(canvas);
      }
    });
  });
}

/* ✅ ساخت IntersectionObserver یک‌بار */
function initSparkObserver(){
  if(_sparkObserver) return;

  _sparkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const canvas = entry.target;
        const id = canvas.dataset.sparkCanvas;
        const asset = window.DATA.find(id);
        if(asset){
          drawSparkline(canvas, asset).catch(() => {});
        }
        _sparkObserver.unobserve(canvas);
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0.01
  });
}

/* ============================================================
   HOME RENDERS
============================================================ */
function renderFeatured(){
  const c = $('[data-featured]');
  if(!c) return;
  const list = window.DATA.FEATURED.map(id => window.DATA.find(id)).filter(Boolean);
  c.innerHTML = list.map(marketCardHTML).join('');
  drawAllSparklines(c);
}

function renderMostUsed(){
  const c = $('[data-most]');
  if(!c) return;
  const list = window.DATA.MOST_USED.map(id => window.DATA.find(id)).filter(Boolean);
  c.innerHTML = list.map(marketCardHTML).join('');
  drawAllSparklines(c);
}

function renderCats(){
  const c = $('[data-cats]');
  if(!c) return;
  const counts = window.DATA.countByCat();

  c.innerHTML = Object.entries(window.DATA.CATEGORIES).map(([k, cat]) => `
    <button class="cat-chip" data-filter-jump="${k}" type="button">
      <span class="cat-chip-icon">${window.Icons.get(cat.icon)}</span>
      <span>${cat.label}</span>
      <small style="opacity:.6">${counts[k] || 0}</small>
    </button>
  `).join('');

  c.querySelectorAll('[data-filter-jump]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      filter = btn.dataset.filterJump;
      $$('[data-filters] .chip').forEach(b => {
        b.classList.toggle('is-active', b.dataset.filter === filter);
      });
      go('markets');
    });
  });
}

function renderTools(){
  const c = $('[data-tools]');
  if(!c) return;

  const tools = [
    { id:'gold',        name:'محاسبه‌گر طلا',   icon:'calculator' },
    { id:'coin',        name:'محاسبه‌گر سکه',   icon:'coins' },
    { id:'ounce',       name:'محاسبه‌گر انس',   icon:'diamond' },
    { id:'silver',      name:'محاسبه‌گر نقره',  icon:'diamond' },
    { id:'conv',        name:'مبدل ارز',        icon:'exchange' },
    { id:'crypto-conv', name:'مبدل کریپتو',     icon:'bitcoin' },
    { id:'unit-conv',   name:'مبدل واحد',       icon:'swap' },
    { id:'portfolio',   name:'پرتفوی من',       icon:'briefcase' },
    { id:'alerts',      name:'هشدار قیمت',      icon:'bell' },
    { id:'notes',       name:'یادداشت‌ها',       icon:'note' },
    { id:'profit',      name:'محاسبه سود',      icon:'trendingUp' },
    { id:'zakat',       name:'محاسبه زکات',     icon:'check' },
    { id:'avg',         name:'میانگین خرید',    icon:'barChart' },
    { id:'tv',          name:'حالت TV',         icon:'tv' },
    { id:'fullscreen',  name:'تمام‌صفحه',       icon:'external' },
    { id:'export',      name:'خروجی داده',      icon:'download' }
  ];

  c.innerHTML = tools.map(t => `
    <button type="button" class="tool-chip" data-tool="${t.id}" aria-label="${t.name}">
      <span class="tool-chip-icon">${window.Icons.get(t.icon)}</span>
      <span class="tool-chip-name">${t.name}</span>
    </button>
  `).join('');
}

/* ============================================================
   BANK CARD — پرتفوی
============================================================ */
function getUserName(){
  return window.Storage.get('gheymato.username', '') || 'کاربر مهمان';
}

function saveUserName(name){
  window.Storage.set('gheymato.username', name || '');
}

function renderBankCard(){
  const wrap = $('[data-portfolio-card]');
  if(!wrap) return;

  if(!window.DATA || !window.DATA.find || !window.API) return;

  const list = window.Storage.pf.get();
  const userName = getUserName();
  const isEmpty = !list.length;

  let totalBuy = 0, totalNow = 0;

  if(!isEmpty){
    list.forEach(item => {
      const a = window.DATA.find(item.id);
      const l = window.API.getById(item.id);
      if(!a) return;
      const price = (l && l.price != null) ? l.price : item.buyPrice;
      totalBuy += item.buyPrice * item.qty;
      totalNow += price * item.qty;
    });
  }

  const pl = totalNow - totalBuy;
  const plPct = totalBuy > 0 ? (pl / totalBuy) * 100 : 0;
  const up = pl >= 0;
  const firstChar = userName.trim().charAt(0) || '👤';

  let displayValue = '۰ تومان';
  let displayChange = '';
  let subtitle = 'برای شروع دارایی اضافه کنید';

  if(!isEmpty){
    const val = baseToUser(totalNow);
    displayValue = formatNumber(val, 0) + ' ' + unitLabel();
    subtitle = formatNumber(list.length, 0) + ' دارایی';
    displayChange = `
      <span class="bank-card-change">
        ${up ? '▲' : '▼'} ${up ? '+' : ''}${plPct.toFixed(2)}%
      </span>
    `;
  }

  wrap.innerHTML = `
    <div class="bank-card ${isEmpty ? 'is-empty' : ''}" data-tool="portfolio" role="button" tabindex="0" aria-label="پرتفوی من">
      <div class="bank-card-top">
        <div class="bank-card-brand">
          <img src="assets/logo.webp" alt="قیمتو">
          <div class="bank-card-brand-text">
            <strong>قیمتو</strong>
            <small>${isEmpty ? 'پرتفوی خالی' : subtitle}</small>
          </div>
        </div>
        <div class="bank-card-chip"></div>
      </div>
      <div class="bank-card-center">
        <span class="bank-card-label">ارزش کل پرتفوی</span>
        <span class="bank-card-value">${displayValue}</span>
        ${displayChange}
      </div>
      <div class="bank-card-bottom">
        <div class="bank-card-user">
          <div class="bank-card-avatar">${firstChar}</div>
          <div class="bank-card-user-info">
            <strong>${window.U.esc(userName)}</strong>
            <small>${isEmpty ? 'برای شروع دارایی اضافه کنید' : 'دارایی‌های شما'}</small>
          </div>
        </div>
        <button type="button" class="bank-card-add" data-tool="portfolio" aria-label="افزودن دارایی">
          ${window.Icons.get('plus')}
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   MARKETS — رندر بازارها (Grid / List)
============================================================ */
function renderMarkets(){
  const g = $('[data-market-grid]');
  if(!g) return;

  let list = window.DATA.ASSETS;
  if(filter !== 'all') list = list.filter(a => a.cat === filter);
  if(search){
    const q = search.toLowerCase();
    list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }

  const cnt = $('[data-count]');
  if(cnt) cnt.textContent = formatNumber(list.length, 0) + ' نماد';

  /* ✅ حفظ حالت نمایش */
  g.classList.toggle('view-list', marketView === 'list');

  g.innerHTML = list.map(marketCardHTML).join('');
  drawAllSparklines(g);
}

/* ============================================================
   CARS — نگاشت ID به تصویر
============================================================ */
const CAR_IMAGE_MAP = {
  'وانت-آریسان': 'وانت-آریسان.jpg',
  'سورن-TU5P': 'سورن-(TU5P).jpg',
  'سورن-XU7P-رینگ-فولادی': 'سورن-XU7P-(رینگ-فولادی).jpg',
  'سورن-XU7P': 'سورن-(TU5P).jpg',
  'سورن-پلاس-دوگانه-سوز-کپسول-کوچک': 'سورن-پلاس-دوگانه-سوز-(کپسول-کوچک).jpg',
  'سورن-پلاس-دوگانه-سوز-کپسول-بزرگ': 'سورن-پلاس-دوگانه-سوز-(کپسول-بزرگ).jpg',
  'دنا-پلاس-MT6-رینگ-فولادی': 'دنا-پلاس-اتوماتیک.jpg',
  'دنا-پلاس-MT6': 'دنا-پلاس-اتوماتیک.jpg',
  'دنا-پلاس-اتوماتیک': 'دنا-پلاس-اتوماتیک.jpg',
  'پژو-207-موتور-TU3': 'پژو-207-موتور-TU3.jpg',
  'پژو-207-دنده-ای-هیدرولیک': 'پژو-207-دنده-ای-(هیدرولیک).jpg',
  'پژو-207-دنده-ای-برقی': 'پژو-207-دنده-ای-(هیدرولیک).jpg',
  'پژو-207-دنده-ای-پانوراما-رینگ-فولادی': 'پژو-207-دنده-ای-پانوراما-(رینگ-فولادی).jpg',
  'پژو-207-دنده-ای-پانوراما': 'پژو-207-دنده-ای-پانوراما.jpg',
  'پژو-207-اتوماتیک': 'پژو-207-اتوماتیک.jpg',
  'پژو-207-اتوماتیک-پانوراما': 'پژو-207-اتوماتیک-پانوراما.jpg',
  'راناپلاس': 'راناپلاس.jpg',
  'تارا-دستی-V1': 'تارا-دستی-V1.jpg',
  'تارا-اتوماتیک-V4': 'تارا-اتوماتیک-V4.jpg',
  'تارا-اتوماتیک-توربو': 'تارا-اتوماتیک-(توربو).jpg',
  'هایما-اس-5-S5-پرو': 'هایما-اس-5-(-S5-)-پرو.jpg',
  'هایما-اس-7-S7-پرو': 'هایما-اس-7-(-S7-)-پرو.jpg',
  'هایما-8-اس-8S-': 'هایما-8-اس-(-8S-).jpg',
  'هایما-7X': 'هایما-7X.jpg',
  'پیکاپ-فوتون-اتوماتیک': 'پیکاپ-فوتون-(اتوماتیک).jpg',
  'ری-را': 'ری-را.jpg',
  'سهند-S': 'سهند-S.jpg',
  'اطلس-S': 'اطلس-S.jpg',
  'اطلس-GL': 'اطلس-GL.jpg',
  'اطلس-G': 'اطلس-G.jpg',
  'اطلس-اتوماتیک': 'اطلس-اتوماتیک.jpg',
  'ساینا-S': 'ساینا-S.jpg',
  'ساینا-دوگانه-سوز': 'ساینا-دوگانه-سوز.jpg',
  'شاهین-GL': 'شاهین-GL.jpg',
  'شاهین-G-سانروف': 'شاهین-اتوماتیک-G.jpg',
  'شاهین-اتوماتیک-G': 'شاهین-اتوماتیک-G.jpg',
  'شاهین-دنده-پلاس': 'شاهین-دنده-پلاس.webp',
  'شاهین-اتوماتیک-پلاس': 'شاهین-اتوماتیک-پلاس.jpg',
  'سایپا-151-GX': 'سایپا-151-GX.jpg',
  'سایپا-151-GX-پاششی': 'سایپا-151-GX.jpg',
  'زامیاد-اکستند-EX': 'زامیاد-اکستند-EX-(دوگانه-سوز).jpg',
  'زامیاد-اکستند-EX-دوگانه-سوز': 'زامیاد-اکستند-EX-(دوگانه-سوز).jpg',
  'چانگان-CS35-مونتاژ': 'چانگان-CS35-(مونتاژ).jpg',
  'چانگان-CS55-مونتاژ': 'چانگان-CS55-(مونتاژ).jpg',
  'سیتروئن-C3-XR': 'سیتروئن-C3-XR.webp',
  'X77-الیت': 'X77-(الیت).jpg',
  'آریزو6-Z6-GT': 'آریزو6-(Z6-GT).jpg',
  'تیگو7-F7-پرومکس-AWD': 'تیگو7-(F7)-پرومکس-AWD.jpg',
  'تیگو-8-F8-پرومکس': 'تیگو-8-(F8)-پرومکس.jpg',
  'اکستریم-TX': 'اکستریم-TX.jpg',
  'اکستریم-QX': 'اکستریم-QX.jpg',
  'بک-X3': 'بک-X3.jpg',
  'جک-SR3': 'جک-SR3.jpg',
  'کی-ام-سی-ایگل': 'کی-ام-سی-ایگل.jpg',
  'کی-ام-سی-J7': 'کی-ام-سی-J7.jpg',
  'کی-ام-سی-T8': 'کی-ام-سی-T8.jpg',
  'کی-ام-سی-T9': 'کی-ام-سی-T9.jpg',
  'فیدلیتی-پرستیژ-7-نفره': 'فیدلیتی-پرستیژ-(7-نفره).jpg',
  'هاوال-H9-آپشنال': 'هاوال-H9-(آپشنال).jpg',
  'هونگچی-H5': 'هونگچی-H5.jpg',
  'اینوی-هیبریدی': 'اینوی-هیبریدی.jpg'
};

function getCarImage(car){
  if(!car || !car.id) return 'assets/cars/x-car.webp';
  const img = CAR_IMAGE_MAP[car.id];
  return img ? 'assets/cars/' + img : 'assets/cars/x-car.webp';
}

/* ============================================================
   CAR CARD HTML
============================================================ */
function carCardHTML(car){
  const imgSrc = getCarImage(car);
  const priceMarket = car.priceMarket;
  const priceFactory = car.priceFactory;
  const changePercent = car.changePercent != null ? car.changePercent : 0;
  const up = changePercent >= 0;
  const hasChange = changePercent !== 0;

  const statusMap = {
    'available':    { label: 'موجود',       cls: 'success' },
    'unavailable':  { label: 'ناموجود',     cls: 'muted' },
    'coming-soon':  { label: 'به زودی',     cls: 'info' },
    'discontinued': { label: 'توقف تولید',  cls: 'danger' },
    'not-selling':  { label: 'توقف فروش',   cls: 'danger' }
  };
  const status = statusMap[car.status] || { label: '', cls: '' };

  const fmt = (v) => v != null ? formatPrice({ ptype: 'rial', dec: 0 }, v) : '—';
  const isPlaceholder = priceMarket == null && priceFactory == null;

  return `
    <article class="car-card" data-car-id="${window.U.esc(car.id || '')}" role="button" tabindex="0" aria-label="${window.U.esc(car.name)}">
      <div class="car-card-image">
        <img src="${imgSrc}" 
             alt="${window.U.esc(car.name)}" 
             loading="lazy"
             onerror="this.onerror=null;this.src='assets/cars/x-car.webp'">
        <img class="car-card-watermark" 
             src="assets/logo.webp" 
             alt=""
             aria-hidden="true">
        ${status.label ? `<span class="car-card-status ${status.cls}">${status.label}</span>` : ''}
      </div>
      
      <div class="car-card-body">
        <h3 class="car-card-name">${window.U.esc(car.name || '—')}</h3>
        <span class="car-card-category">${window.U.esc(car.category || '')}</span>
        
        ${!isPlaceholder ? `
          <div class="car-card-prices">
            ${priceFactory != null ? `
              <div class="car-price-row">
                <span class="car-price-label">
                  <span data-icon="factory"></span>
                  کارخانه
                </span>
                <strong class="car-price-value factory">${fmt(priceFactory)}</strong>
              </div>
            ` : ''}
            ${priceMarket != null ? `
              <div class="car-price-row">
                <span class="car-price-label">
                  <span data-icon="store"></span>
                  بازار
                </span>
                <strong class="car-price-value market">${fmt(priceMarket)}</strong>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="car-card-empty">قیمتی ثبت نشده</div>
        `}
        
        ${hasChange ? `
          <div class="car-card-change ${up ? 'up' : 'down'}">
            ${up ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}٪
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

/* ============================================================
   CARS — رندر کامل
============================================================ */
async function renderCars(){
  const wrap = $('[data-home-cars]');
  const listEl = $('[data-cars-list]');
  const emptyEl = $('[data-cars-empty]');
  const updatedEl = $('[data-cars-updated]');

  if(!wrap && !listEl) return;

  if(!window.API || !window.API.fetchCars){
    const msg = '<div class="empty"><h3>API خودرو در دسترس نیست</h3></div>';
    if(wrap) wrap.innerHTML = msg;
    if(listEl) listEl.innerHTML = msg;
    return;
  }

  try {
    let data = window.API.getCars && window.API.getCars();
    if(!data){
      data = await window.API.fetchCars();
    }

    if(!data || !data.cars || !data.cars.length){
      const msg = '<div class="empty"><h3>داده‌ای موجود نیست</h3></div>';
      if(wrap) wrap.innerHTML = msg;
      if(listEl) listEl.innerHTML = msg;
      return;
    }

    let list = data.cars.slice();
    if(carsFilter && carsFilter !== 'all'){
      list = list.filter(function(c){ return c.status === carsFilter; });
    }
    if(carsSearch){
      const q = carsSearch.toLowerCase();
      list = list.filter(function(c){
        return (c.name || '').toLowerCase().includes(q) ||
               (c.category || '').toLowerCase().includes(q);
      });
    }

    if(wrap){
      const homeList = list.slice(0, 4);
      wrap.innerHTML = homeList.map(function(c){
        return carCardHTML(c);
      }).join('');
    }

    if(listEl){
      listEl.innerHTML = list.map(function(c){
        return carCardHTML(c);
      }).join('');
    }

    if(emptyEl) emptyEl.hidden = list.length > 0;

    if(updatedEl && data.updatedTehran){
      updatedEl.textContent = 'آخرین به‌روزرسانی: ' + data.updatedTehran;
    }

    const countEl = $('[data-cars-count]');
    if(countEl) countEl.textContent = formatNumber(list.length, 0) + ' خودرو';

    if(window.Icons && window.Icons.hydrate){
      if(wrap) window.Icons.hydrate(wrap);
      if(listEl) window.Icons.hydrate(listEl);
    }

  } catch(err){
    console.error('[Cars]', err);
    const msg = '<div class="empty"><h3>خطا در بارگذاری خودرو</h3></div>';
    if(wrap) wrap.innerHTML = msg;
    if(listEl) listEl.innerHTML = msg;
  }
}

/* ============================================================
   CAR MODAL — مودال جزئیات خودرو
============================================================ */
function openCarModal(carId){
  const cars = window.API.getCars && window.API.getCars();
  if(!cars || !cars.cars){
    toast('داده خودرو در دسترس نیست', 'warning');
    return;
  }

  const car = cars.cars.find(function(c){ return c.id === carId; });
  if(!car){
    toast('خودرو پیدا نشد', 'error');
    return;
  }

  const specs = window.API.getCarSpecsById ? window.API.getCarSpecsById(carId) : null;

  const imgSrc = getCarImage(car);
  const fmt = (v) => v != null ? formatPrice({ ptype: 'rial', dec: 0 }, v) : '—';

  const statusMap = {
    'available':    'موجود',
    'unavailable':  'ناموجود',
    'coming-soon':  'به زودی',
    'discontinued': 'توقف تولید',
    'not-selling':  'توقف فروش'
  };

  const changePercent = car.changePercent || 0;
  const up = changePercent >= 0;
  const changeVal = car.change || 0;
  const changeValAbs = Math.abs(changeVal);

  /* ═══ مشخصات فنی ═══ */
  let specsHTML = '';
  if(specs && specs.specifications && Object.keys(specs.specifications).length > 0){
    const specRows = Object.entries(specs.specifications)
      .filter(([k, v]) => k && v && k !== 'مشخصات' && k !== 'کد کلاس خودرو' && k !== 'کد کلاس(های) خودرو')
      .map(([k, v]) => `
        <div class="car-spec-row">
          <span class="car-spec-label">${window.U.esc(k)}</span>
          <strong class="car-spec-value">${window.U.esc(String(v))}</strong>
        </div>
      `).join('');

    if(specRows){
      specsHTML = `
        <details class="car-modal-section" open>
          <summary class="car-modal-section-head">
            <span class="car-modal-section-icon" data-icon="settings"></span>
            <span>مشخصات فنی</span>
            <span class="car-modal-section-count">${Object.keys(specs.specifications).length}</span>
          </summary>
          <div class="car-spec-grid">
            ${specRows}
          </div>
        </details>
      `;
    }
  }

  /* ═══ امکانات و تجهیزات ═══ */
  let featuresHTML = '';
  if(specs && specs.features && Object.keys(specs.features).length > 0){
    const featRows = Object.entries(specs.features)
      .filter(([k, v]) => k && v && k !== 'مشخصات' && k !== 'تیپ' && v !== 'مقدار')
      .map(([k, v]) => `
        <div class="car-feature-row">
          <div class="car-feature-title">${window.U.esc(k)}</div>
          <div class="car-feature-value">${window.U.esc(String(v))}</div>
        </div>
      `).join('');

    if(featRows){
      featuresHTML = `
        <details class="car-modal-section" open>
          <summary class="car-modal-section-head">
            <span class="car-modal-section-icon" data-icon="check"></span>
            <span>امکانات و تجهیزات</span>
            <span class="car-modal-section-count">${Object.keys(specs.features).length}</span>
          </summary>
          <div class="car-features-list">
            ${featRows}
          </div>
        </details>
      `;
    }
  }

  /* ═══ توضیحات ═══ */
  let descriptionHTML = '';
  if(specs && specs.description && Array.isArray(specs.description) && specs.description.length > 0){
    const descHTML = specs.description
      .filter(d => d && d.trim())
      .map(d => `<p class="car-desc-paragraph">${window.U.esc(d)}</p>`)
      .join('');

    if(descHTML){
      descriptionHTML = `
        <details class="car-modal-section">
          <summary class="car-modal-section-head">
            <span class="car-modal-section-icon" data-icon="info"></span>
            <span>توضیحات تکمیلی</span>
          </summary>
          <div class="car-description">
            ${descHTML}
          </div>
        </details>
      `;
    }
  }

  /* ═══ خالی ═══ */
  const hasDetails = specsHTML || featuresHTML || descriptionHTML;
  const emptySpecsHTML = !hasDetails ? `
    <div class="car-modal-empty-details">
      <span data-icon="info"></span>
      <span>مشخصات تکمیلی برای این خودرو در دسترس نیست</span>
    </div>
  ` : '';

  /* ═══ ساختار مودال ═══ */
  openModal(`<span data-icon="car"></span> ${window.U.esc(car.name)}`, `
    <div class="car-modal-image">
      <img src="${imgSrc}" 
           alt="${window.U.esc(car.name)}"
           onerror="this.onerror=null;this.src='assets/cars/x-car.webp'">
      <img class="car-modal-watermark" src="assets/logo.webp" alt="">
      <span class="car-modal-badge-floating ${car.status || ''}">${statusMap[car.status] || '—'}</span>
    </div>
    
    <div class="car-modal-info">
      <div class="car-modal-badge-row">
        <span class="car-modal-badge category">${window.U.esc(car.category || '—')}</span>
        ${specs && specs.title ? `<span class="car-modal-badge title" title="${window.U.esc(specs.title)}">${window.U.esc(specs.title.length > 60 ? specs.title.slice(0, 60) + '...' : specs.title)}</span>` : ''}
      </div>
      
      <div class="car-modal-prices">
        ${car.priceFactory != null ? `
          <div class="car-modal-price-card">
            <span class="car-modal-price-label">قیمت کارخانه</span>
            <strong class="car-modal-price-value">${fmt(car.priceFactory)}</strong>
          </div>
        ` : ''}
        ${car.priceMarket != null ? `
          <div class="car-modal-price-card market">
            <span class="car-modal-price-label">قیمت بازار</span>
            <strong class="car-modal-price-value">${fmt(car.priceMarket)}</strong>
          </div>
        ` : ''}
      </div>
      
      ${changePercent !== 0 ? `
        <div class="car-modal-change ${up ? 'up' : 'down'}">
          <span>${up ? '▲' : '▼'}</span>
          <span>${Math.abs(changePercent).toFixed(2)}٪</span>
          ${changeValAbs > 0 ? `<span style="font-size:10.5px;opacity:.7">(${up ? '+' : '-'}${formatPrice({ptype:'rial'}, changeValAbs)})</span>` : ''}
        </div>
      ` : ''}
      
      ${specsHTML}
      ${featuresHTML}
      ${descriptionHTML}
      ${emptySpecsHTML}
    </div>
  `);

  const modalBody = $('[data-modal-body]');
  if(window.Icons && window.Icons.hydrate && modalBody){
    window.Icons.hydrate(modalBody);
  }
}

/* ============================================================
   FAVORITES
============================================================ */
function renderFavs(){
  const g = $('[data-fav-grid]');
  const empty = $('[data-fav-empty]');
  const cnt = $('[data-fav-count]');
  if(!g) return;

  const list = window.Storage.fav.get().map(id => window.DATA.find(id)).filter(Boolean);

  if(cnt) cnt.textContent = formatNumber(list.length, 0) + ' مورد';
  if(empty) empty.hidden = list.length > 0;

  g.innerHTML = list.map(marketCardHTML).join('');
  drawAllSparklines(g);
}

/* ============================================================
   HEADER TICKER
============================================================ */
function renderHdrTicker(){
  const track = $('[data-hdr-ticker-track]');
  if(!track) return;
  if(!window.API || !window.API.getById) return;
  if(!window.DATA || !window.DATA.find) return;

  const ids = [
    'gold18', 'coin', 'dollar', 'euro', 'ounce', 'mesghal',
    'btc', 'eth', 'silver', 'oil_brent', 'bourse', 'usdt',
    'gold24', 'coin_bahar', 'gbp', 'aed', 'sol'
  ];

  const items = ids.map(id => {
    const a = window.DATA.find(id);
    if(!a) return '';
    const l = window.API.getById(id);
    if(!l || l.price == null) return '';
    const cp = l.changePercent || 0;
    const up = cp >= 0;
    return `
      <div class="hdr-ticker-item">
        <span class="name">${window.U.esc(a.short || a.name)}</span>
        <span class="price">${formatPrice(a, l.price)}</span>
        <span class="chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(cp).toFixed(2)}%</span>
      </div>
    `;
  }).filter(Boolean).join('');

  if(!items) return;

  const newContent = items + items;
  if(track.dataset.content === newContent && track.children.length > 0){
    return;
  }
  track.dataset.content = newContent;
  track.innerHTML = newContent;

  track.style.animation = 'none';
  void track.offsetWidth;
  requestAnimationFrame(() => {
    track.style.animation = '';
  });
}

/* ============================================================
   CHART PAGE
============================================================ */
async function renderChartPage(){
  const asset = window.DATA.find(activeChartId);
  if(!asset) return;

  const live = window.API.getById(asset.id);

  const iconEl = $('[data-c-icon]');
  if(iconEl) iconEl.innerHTML = assetIcon(asset);

  const nameEl = $('[data-c-name]');
  if(nameEl) nameEl.textContent = asset.name;

  const codeEl = $('[data-c-code]');
  if(codeEl) codeEl.textContent = asset.code;

  const favEl = $('[data-c-fav]');
  if(favEl){
    const isFav = window.Storage.fav.get().includes(asset.id);
    favEl.classList.toggle('is-fav', isFav);
    favEl.dataset.favToggle = asset.id;
    favEl.setAttribute('aria-label', isFav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی');
    favEl.textContent = isFav ? '★' : '☆';
  }

  const priceEl = $('[data-c-price]');
  if(priceEl){
    priceEl.textContent = live && live.price != null ? formatPrice(asset, live.price) : '—';
  }

  const changeEl = $('[data-c-change]');
  if(changeEl && live && live.changePercent != null){
    const up = live.changePercent >= 0;
    changeEl.textContent = (up ? '▲' : '▼') + ' ' + Math.abs(live.changePercent).toFixed(2) + '%';
    changeEl.className = 'chart-change ' + (up ? 'up' : 'down');
  } else if(changeEl){
    changeEl.textContent = '—';
    changeEl.className = 'chart-change';
  }

  const unitEl = $('[data-c-unit]');
  if(unitEl) unitEl.textContent = fullUnitLabel(asset);

  const timeEl = $('[data-c-time]');
  if(timeEl) timeEl.textContent = live && live.time ? live.time : '—';

  const canvas = $('[data-chart-canvas]');
  if(canvas) drawChartAsync(canvas, asset).catch(function(){});

  await renderChartQuestions(asset, live);
  renderBubbleAnalysis(asset, live);

  const relEl = $('[data-c-related]');
  if(relEl){
    const related = window.DATA.byCat(asset.cat)
      .filter(a => a.id !== asset.id)
      .slice(0, 10);
    relEl.innerHTML = related.map(marketCardHTML).join('');
    drawAllSparklines(relEl);
  }
}

/* ============================================================
   CHART QUESTIONS
============================================================ */
async function renderChartQuestions(asset, live){
  const listEl = $('[data-c-questions]');
  const dateEl = $('[data-c-questions-date]');
  if(!listEl) return;

  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  if(dateEl) dateEl.textContent = today;

  if(!live || live.price == null){
    listEl.innerHTML = '<div class="chart-q-item"><div class="chart-q-body"><span class="chart-q-answer neutral">داده‌ای موجود نیست</span></div></div>';
    return;
  }

  const current = live.price;
  const high = live.high;
  const low = live.low;
  const open = live.open;
  const changePct = live.changePercent || 0;
  const unitText = asset.unit || '';

  let history = [];
  let historyWarning = false;

  try {
    if(window.API.getHistory){
      history = await window.API.getHistory(asset, 365);
      if(!history || history.length < 5){
        history = await window.API.getHistory(asset, 30);
        historyWarning = true;
      }
    }
  } catch(e){
    historyWarning = true;
  }

  const sortedHistory = (history || []).slice().sort((a, b) => a.t - b.t);

  let warningBanner = '';
  if(historyWarning || sortedHistory.length < 10){
    warningBanner = `
      <div class="chart-q-warning" role="alert">
        <span>⚠️</span>
        <span>داده تاریخی کامل در دسترس نیست — برخی پاسخ‌ها تقریبی هستند</span>
      </div>
    `;
  }

  function findPriceAt(msAgo){
    if(!sortedHistory.length) return null;
    const target = Date.now() - msAgo;
    let closest = null, minDiff = Infinity;
    for(const p of sortedHistory){
      const diff = Math.abs(p.t - target);
      if(diff < minDiff){ minDiff = diff; closest = p; }
    }
    const tolerance = msAgo > 90 * 24 * 60 * 60 * 1000
      ? 30 * 24 * 60 * 60 * 1000
      : 3 * 24 * 60 * 60 * 1000;
    if(closest && minDiff < tolerance){
      return closest.p;
    }
    return null;
  }

  const hourAgo = 60 * 60 * 1000;
  const dayAgo = 24 * 60 * 60 * 1000;
  const weekAgo = 7 * dayAgo;
  const monthAgo = 30 * dayAgo;
  const sixMonthAgo = 180 * dayAgo;
  const yearAgo = 365 * dayAgo;
  const threeMonthAgo = 90 * dayAgo;

  function pctChange(from, to){
    if(from == null || to == null || from === 0) return null;
    return ((to - from) / from) * 100;
  }

  function changeItem(label, change){
    const hasChange = change != null;
    let cls = 'neutral';
    if(hasChange){
      cls = change >= 0 ? 'up' : 'down';
    }
    const changeText = hasChange
      ? `<span class="chart-q-answer ${cls}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}٪</span>`
      : `<span class="chart-q-answer neutral">—</span>`;

    return `
      <div class="chart-q-item">
        <div class="chart-q-body">
          <span class="chart-q-question">${label}</span>
          ${changeText}
        </div>
      </div>
    `;
  }

  function valueItem(label, value){
    return `
      <div class="chart-q-item">
        <div class="chart-q-body">
          <span class="chart-q-question">${label}</span>
          <span class="chart-q-answer neutral">${value || '—'}</span>
        </div>
      </div>
    `;
  }

  const priceHourAgo = findPriceAt(hourAgo);
  const priceDayAgo = findPriceAt(dayAgo);
  const priceWeekAgo = findPriceAt(weekAgo);
  const priceMonthAgo = findPriceAt(monthAgo);
  const price6MonthAgo = findPriceAt(sixMonthAgo);
  const priceYearAgo = findPriceAt(yearAgo);
  const price3MonthAgo = findPriceAt(threeMonthAgo);

  const questions = [];
  const u = unitText ? ' / ' + unitText : '';

  const currentDisplay = asset.ptype === 'usd'
    ? '$' + formatNumber(current, asset.dec || 2) + u
    : formatNumber(baseToUser(current), 0) + ' ' + unitLabel() + u;

  questions.push(valueItem(
    `در حال حاضر قیمت ${asset.name} چقدر می‌باشد؟`,
    currentDisplay
  ));

  questions.push(changeItem(
    `قیمت ${asset.name} نسبت به دیروز چقدر تغییر کرده است؟`,
    priceDayAgo ? pctChange(priceDayAgo, current) : changePct
  ));

  if(priceHourAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به یک ساعت قبل چقدر تغییر کرده است؟`,
      pctChange(priceHourAgo, current)
    ));
  }

  if(open != null){
    questions.push(valueItem(
      `نرخ بازگشایی ${asset.name} در روز جاری چقدر بوده است؟`,
      formatPrice(asset, open) + u
    ));
  }

  if(low != null){
    questions.push(valueItem(
      `پایین‌ترین قیمت امروز ${asset.name} چقدر بوده است؟`,
      formatPrice(asset, low) + u
    ));
  }

  if(high != null){
    questions.push(valueItem(
      `بالاترین قیمت امروز ${asset.name} چقدر بوده است؟`,
      formatPrice(asset, high) + u
    ));
  }

  if(priceWeekAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به یک هفته گذشته چقدر تغییر کرده است؟`,
      pctChange(priceWeekAgo, current)
    ));
  }

  if(priceMonthAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به یک ماه گذشته چقدر تغییر کرده است؟`,
      pctChange(priceMonthAgo, current)
    ));
  }

  if(price6MonthAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به ۶ ماه گذشته چقدر تغییر کرده است؟`,
      pctChange(price6MonthAgo, current)
    ));
  }

  if(sortedHistory.length > 0){
    let highest = { p: 0, t: 0 };
    for(const p of sortedHistory){
      if(p.p > highest.p){ highest = p; }
    }
    if(highest.p > 0){
      const dateStr = new Date(highest.t).toLocaleDateString('fa-IR');
      questions.push(`
        <div class="chart-q-item">
          <div class="chart-q-body">
            <span class="chart-q-question">بالاترین قیمت ${asset.name} تاکنون چقدر و در چه تاریخی بوده است؟</span>
            <span class="chart-q-answer neutral">${formatPrice(asset, highest.p)}${u}</span>
            <span class="chart-q-date-tiny">${dateStr}</span>
          </div>
        </div>
      `);
    }
  }

  if(priceDayAgo){
    questions.push(changeItem(
      `سود روزانه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      pctChange(priceDayAgo, current)
    ));
  }

  if(priceWeekAgo){
    questions.push(changeItem(
      `سود یک هفته سرمایه‌گذاری در ${asset.name} چقدر بوده است؟`,
      pctChange(priceWeekAgo, current)
    ));
  }

  if(priceMonthAgo){
    questions.push(changeItem(
      `سود یک ماهه خرید ${asset.name} چقدر بوده است؟`,
      pctChange(priceMonthAgo, current)
    ));
  }

  if(price3MonthAgo){
    questions.push(changeItem(
      `سود سه ماهه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      pctChange(price3MonthAgo, current)
    ));
  }

  if(price6MonthAgo){
    questions.push(changeItem(
      `سود شش ماهه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      pctChange(price6MonthAgo, current)
    ));
  }

  if(priceYearAgo){
    questions.push(changeItem(
      `سود سالانه سرمایه‌گذاری در ${asset.name} چقدر بوده است؟`,
      pctChange(priceYearAgo, current)
    ));
  }

  listEl.innerHTML = warningBanner + questions.join('');
}

/* ============================================================
   تحلیل حباب
============================================================ */
function renderBubbleAnalysis(asset, live){
  const wrap = $('[data-bubble-analysis]');
  const body = $('[data-bubble-body]');
  if(!wrap || !body) return;

  const isGold = asset.cat === 'gold' && (asset.tgju === 'geram18' || asset.tgju === 'geram24');
  const isCoin = asset.id === 'coin' || asset.id === 'coin_bahar';

  if(!isGold && !isCoin){
    wrap.hidden = true;
    return;
  }

  if(!live || live.price == null){
    wrap.hidden = true;
    return;
  }

  const ounce = window.API.getById('ounce');
  const dollar = window.API.getById('dollar');

  if(!ounce || !dollar || ounce.price == null || dollar.price == null){
    wrap.hidden = true;
    return;
  }

  const ounceUSD = ounce.price;
  const dollarRial = dollar.price;
  const goldIran = live.price;

  let karat = 18;
  if(asset.tgju === 'geram24') karat = 24;
  else if(isCoin) karat = 24;

  const gramWorldRial = (ounceUSD / 31.1035) * dollarRial;
  const gramWorldKarat = gramWorldRial * (karat / 24);

  let worldValue, iranValue;
  if(isCoin){
    worldValue = gramWorldKarat * 8.133;
    iranValue = goldIran;
  } else {
    worldValue = gramWorldKarat;
    iranValue = goldIran;
  }

  const bubble = iranValue - worldValue;
  const bubblePct = (bubble / worldValue) * 100;

  const bubbleClass = bubblePct > 2 ? 'bubble-positive' : (bubblePct < -2 ? 'bubble-negative' : 'bubble-neutral');
  const bubbleLabel = bubblePct > 2 ? 'حباب مثبت' : (bubblePct < -2 ? 'حباب منفی' : 'متعادل');

  wrap.hidden = false;

  body.innerHTML = `
    <div class="bubble-row">
      <span>انس جهانی طلا</span>
      <strong>$${formatNumber(ounceUSD, 2)}</strong>
    </div>
    <div class="bubble-row">
      <span>نرخ دلار</span>
      <strong>${formatPrice({ptype:'rial'}, dollarRial)}</strong>
    </div>
    <div class="bubble-row">
      <span>قیمت جهانی گرم ${karat} عیار</span>
      <strong>${formatPrice({ptype:'rial'}, gramWorldKarat)}</strong>
    </div>
    <div class="bubble-row">
      <span>قیمت ${isCoin ? 'سکه' : 'گرم'} در ایران</span>
      <strong>${formatPrice({ptype:'rial'}, iranValue)}</strong>
    </div>
    <div class="bubble-row bubble-total">
      <span>
        ${bubbleLabel}
        <span class="bubble-badge ${bubbleClass}" style="margin-right:8px">
          ${bubblePct >= 0 ? '+' : ''}${bubblePct.toFixed(2)}%
        </span>
      </span>
      <strong class="${bubbleClass}">
        ${bubble >= 0 ? '+' : ''}${formatPrice({ptype:'rial'}, Math.abs(bubble))}
      </strong>
    </div>
  `;
}

/* ============================================================
   نمودار اصلی
============================================================ */
async function drawChartAsync(canvas, asset){
  try {
    let chartData = null;
    const period = window.CFG.get('chartPeriod') || '1D';

    try {
      const prices = await window.API.history(asset, 60, period);
      if(prices && prices.length >= 2){
        chartData = prices.map(function(p, i){
          return {
            t: Date.now() - (prices.length - i) * 86400000,
            p: p,
            gd: '',
            pd: ''
          };
        });
      }
    } catch(e){
      console.warn('[Chart] history failed:', e.message);
    }

    if(!chartData || chartData.length < 2){
      if(window.API.getHistory){
        try {
          const history = await window.API.getHistory(asset, 30);
          if(history && history.length >= 2){
            chartData = history.map(function(h){
              return {
                t: h.t,
                p: h.p,
                gd: h.gd || '',
                pd: h.pd || ''
              };
            });
          }
        } catch(e){
          console.warn('[Chart] getHistory failed:', e.message);
        }
      }
    }

    if(!chartData || chartData.length < 2) return;

    const first = chartData[0].p;
    const last = chartData[chartData.length - 1].p;
    const up = last >= first;
    const color = up ? '#10b981' : '#ef4444';

    await window.Charts.drawLine(canvas, chartData, {
      padding: 20,
      paddingTop: 30,
      lineWidth: 2.5,
      color: color,
      formatter: function(v){
        return formatPrice(asset, v);
      }
    });

  } catch(e){
    console.warn('[Chart] Failed:', e.message);
  }
}

/* ============================================================
   COMPARE
============================================================ */
function renderCompare(){
  const sA = $('[data-cmp="a"]');
  const sB = $('[data-cmp="b"]');
  if(!sA || !sB) return;

  if(!sA.options.length){
    window.DATA.ASSETS.forEach(a => {
      sA.add(new Option(a.name, a.id));
      sB.add(new Option(a.name, a.id));
    });
    sA.value = 'gold18';
    sB.value = 'dollar';
  }

  const A = window.DATA.find(sA.value);
  const B = window.DATA.find(sB.value);
  if(!A || !B) return;

  const c = $('[data-cmp-chart]');
  if(c){
    (async function(){
      try {
        const histA = await window.API.history(A, 60, '1D');
        const histB = await window.API.history(B, 60, '1D');
        await window.Charts.drawCompare(c, histA, histB);
      } catch(e){
        console.warn('[Compare] failed:', e.message);
      }
    })();
  }

  const st = $('[data-cmp-stats]');
  if(st){
    const lA = window.API.getById(A.id);
    const lB = window.API.getById(B.id);
    st.innerHTML = `
      <div style="padding:14px;border-radius:13px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11px;color:var(--muted);margin-bottom:5px;font-weight:600">${window.U.esc(A.name)}</small>
        <strong style="display:block;font-size:15px;font-weight:800;direction:ltr">${lA ? formatPrice(A, lA.price) : '—'}</strong>
      </div>
      <div style="padding:14px;border-radius:13px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11px;color:var(--muted);margin-bottom:5px;font-weight:600">تغییر ${A.code}</small>
        <strong style="display:block;font-size:15px;font-weight:800;direction:ltr;color:${(lA?.changePercent || 0) >= 0 ? 'var(--up)' : 'var(--down)'}">
          ${(lA?.changePercent || 0) >= 0 ? '+' : ''}${(lA?.changePercent || 0).toFixed(2)}%
        </strong>
      </div>
      <div style="padding:14px;border-radius:13px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11px;color:var(--muted);margin-bottom:5px;font-weight:600">${window.U.esc(B.name)}</small>
        <strong style="display:block;font-size:15px;font-weight:800;direction:ltr">${lB ? formatPrice(B, lB.price) : '—'}</strong>
      </div>
      <div style="padding:14px;border-radius:13px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11px;color:var(--muted);margin-bottom:5px;font-weight:600">تغییر ${B.code}</small>
        <strong style="display:block;font-size:15px;font-weight:800;direction:ltr;color:${(lB?.changePercent || 0) >= 0 ? 'var(--up)' : 'var(--down)'}">
          ${(lB?.changePercent || 0) >= 0 ? '+' : ''}${(lB?.changePercent || 0).toFixed(2)}%
        </strong>
      </div>
    `;
  }

  sA.onchange = renderCompare;
  sB.onchange = renderCompare;
}

/* ============================================================
   ROUTER
============================================================ */
let _goRetries = 0;
const GO_MAX_RETRIES = 50;

function go(page){
  if(!window.DATA || !window.DATA.ASSETS || !window.DATA.ASSETS.length){
    if(_goRetries >= GO_MAX_RETRIES){
      const el = $('.page.is-active') || document.body;
      const errBox = document.createElement('div');
      errBox.className = 'empty';
      errBox.style.padding = '40px 20px';
      errBox.innerHTML = '<h3>خطا در بارگذاری داده‌ها</h3><p style="margin-top:8px;color:var(--muted)">لطفاً اتصال اینترنت را بررسی و صفحه را بازخوانی کنید.</p>';
      if(el && el.appendChild) el.appendChild(errBox);
      return;
    }
    _goRetries++;
    setTimeout(function(){ go(page); }, 100);
    return;
  }
  _goRetries = 0;

  if(!PAGES.includes(page)) page = 'home';
  currentPage = page;

  const pages = $$('.page');
  if(pages.length){
    pages.forEach(p => p.classList.toggle('is-active', p.dataset.page === page));
  }

  const routeBtns = $$('[data-route]');
  if(routeBtns.length){
    routeBtns.forEach(b => b.classList.toggle('is-active', b.dataset.route === page));
  }

  try { history.replaceState(null, '', '#' + page); } catch(e){}

  document.body.classList.remove('sidebar-open');

  try {
    if(page === 'home'){
      renderLiveStrip();
      renderBankCard();
      renderFeatured();
      renderMostUsed();
      renderCats();
      renderTools();
      renderCars().catch(() => {});
    }
    else if(page === 'markets'){
      renderMarkets();
    }
    else if(page === 'chart'){
      if(!activeChartId && window.DATA.ASSETS.length){
        activeChartId = window.DATA.ASSETS[0].id;
      }
      renderChartPage().catch(() => {});
    }
    else if(page === 'compare'){
      renderCompare();
    }
    else if(page === 'favorites'){
      renderFavs();
    }
    else if(page === 'cars'){
      renderCars().catch(() => {});
    }

    renderHdrTicker();
  } catch(err){
    console.error('[UI.go] error on page "' + page + '":', err);
  }
}

/* ============================================================
   MODAL / TOAST
============================================================ */
function openModal(title, bodyHTML){
  const m = $('[data-modal]');
  if(!m) return;
  const titleEl = $('[data-modal-title]');
  const bodyEl = $('[data-modal-body]');
  if(titleEl) titleEl.innerHTML = title;
  if(bodyEl) bodyEl.innerHTML = bodyHTML;
  m.classList.add('is-open');
  if(window.Icons && window.Icons.hydrate) window.Icons.hydrate(bodyEl);
}

function closeModal(){
  const m = $('[data-modal]');
  if(m) m.classList.remove('is-open');
}

const _toastHistory = new Map();
let _lastToastText = '';
let _lastToastTime = 0;

function toast(msg, type = '', id = null){
  const t = $('[data-toast]');
  if(!t) return;

  const now = Date.now();

  if(id && _toastHistory.has(id)){
    const last = _toastHistory.get(id);
    if(now - last < 60000) return;
  }
  if(!id && msg === _lastToastText && (now - _lastToastTime) < 3000) return;

  if(id) _toastHistory.set(id, now);
  _lastToastText = msg;
  _lastToastTime = now;

  t.textContent = msg;
  t.className = 'toast is-show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => {
    t.classList.remove('is-show');
    if(!id) _lastToastText = '';
  }, 2400);
}

/* ============================================================
   HELPERS
============================================================ */
function setFieldError(input, message){
  if(!input) return;
  input.classList.add('is-error');
  input.setAttribute('aria-invalid', 'true');
  let err = input.parentElement?.querySelector('.field-error');
  if(!err){
    err = document.createElement('small');
    err.className = 'field-error';
    input.parentElement?.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(input){
  if(!input) return;
  input.classList.remove('is-error');
  input.removeAttribute('aria-invalid');
  const err = input.parentElement?.querySelector('.field-error');
  if(err) err.remove();
}

function validatePositive(input, fieldName){
  const v = parseFormattedNumber(input?.value);
  if(v == null || v <= 0){
    setFieldError(input, fieldName + ' باید عددی مثبت باشد');
    return null;
  }
  clearFieldError(input);
  return v;
}

/* ============================================================
   TOOLS — (همه توابع اصلی بدون تغییر)
============================================================ */
function money(v){ return formatPrice({ptype:'rial'}, v); }

function toolGold(){
  const gold = window.API.getById('gold18');
  if(!gold || gold.price == null){ toast('در حال دریافت قیمت...', 'warning'); return; }

  openModal(`<span data-icon="calculator"></span> محاسبه‌گر طلا`, `
    <div class="form-grid">
      <div class="form-group">
        <label>وزن (گرم)</label>
        <input class="input" type="text" inputmode="decimal" value="10" data-money data-gw aria-label="وزن به گرم">
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-gk aria-label="عیار">
          <option value="18" selected>۱۸</option>
          <option value="24">۲۴</option>
          <option value="22">۲۲</option>
          <option value="21">۲۱</option>
          <option value="14">۱۴</option>
        </select>
      </div>
      <div class="form-group">
        <label>اجرت ساخت (%)</label>
        <input class="input" type="text" inputmode="decimal" value="7" data-money data-gwg aria-label="اجرت ساخت">
      </div>
      <div class="form-group">
        <label>سود فروشنده (%)</label>
        <input class="input" type="text" inputmode="decimal" value="5" data-money data-gp aria-label="سود فروشنده">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>مالیات (%)</label>
        <input class="input" type="text" inputmode="decimal" value="9" data-money data-gt aria-label="مالیات">
      </div>
    </div>
    <div class="result-box" data-gold-out></div>
  `);

  function calc(){
    const w = parseFormattedNumber($('[data-gw]')?.value) || 0;
    const k = parseFloat($('[data-gk]')?.value) || 18;
    const wg = parseFormattedNumber($('[data-gwg]')?.value) || 0;
    const pr = parseFormattedNumber($('[data-gp]')?.value) || 0;
    const tx = parseFormattedNumber($('[data-gt]')?.value) || 0;

    const base = gold.price * (k / 18);
    const val = w * base;
    const wA = val * (wg / 100);
    const pA = (val + wA) * (pr / 100);
    const tA = (val + wA + pA) * (tx / 100);
    const tot = val + wA + pA + tA;

    const out = $('[data-gold-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>ارزش طلا</span><strong>${money(val)}</strong></div>
      <div class="result-row"><span>اجرت (${wg}%)</span><strong>${money(wA)}</strong></div>
      <div class="result-row"><span>سود (${pr}%)</span><strong>${money(pA)}</strong></div>
      <div class="result-row"><span>مالیات (${tx}%)</span><strong>${money(tA)}</strong></div>
      <div class="result-row result-total"><span>مبلغ نهایی</span><strong>${money(tot)}</strong></div>
    `;
  }
  $$('[data-gw],[data-gk],[data-gwg],[data-gp],[data-gt]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
}

function toolCoin(){
  const sel = window.DATA.ASSETS.filter(a => ['coin','coin_bahar','nim','rob','gerami'].includes(a.id));
  openModal(`<span data-icon="coins"></span> محاسبه‌گر سکه`, `
    <div class="form-group">
      <label>نوع سکه</label>
      <select class="select" data-ct aria-label="نوع سکه">
        ${sel.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>تعداد</label>
      <input class="input" type="text" inputmode="decimal" value="1" data-money data-cc aria-label="تعداد">
    </div>
    <div class="result-box" data-coin-out></div>
  `);

  function calc(){
    const id = $('[data-ct]')?.value;
    const n = parseFormattedNumber($('[data-cc]')?.value) || 1;
    const live = window.API.getById(id);
    const out = $('[data-coin-out]');
    if(!live || live.price == null){
      if(out) out.innerHTML = '<div class="result-row"><span>در حال دریافت...</span></div>';
      return;
    }
    const tot = live.price * n;
    if(out) out.innerHTML = `
      <div class="result-row"><span>قیمت واحد</span><strong>${money(live.price)}</strong></div>
      <div class="result-row"><span>تعداد</span><strong>${formatNumber(n, 0)} عدد</strong></div>
      <div class="result-row result-total"><span>ارزش کل</span><strong>${money(tot)}</strong></div>
    `;
  }
  $$('[data-ct],[data-cc]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
}

function toolOunce(){
  const ounce = window.API.getById('ounce');
  if(!ounce || ounce.price == null){ toast('در حال دریافت قیمت...', 'warning'); return; }

  openModal(`<span data-icon="diamond"></span> محاسبه‌گر انس`, `
    <div class="form-grid">
      <div class="form-group">
        <label>تعداد انس</label>
        <input class="input" type="text" inputmode="decimal" value="1" data-money data-oc aria-label="تعداد انس">
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-ok aria-label="عیار">
          <option value="24">۲۴ عیار</option>
          <option value="18" selected>۱۸ عیار</option>
          <option value="21">۲۱ عیار</option>
        </select>
      </div>
    </div>
    <div class="result-box" data-ounce-out></div>
  `);

  function calc(){
    const n = parseFormattedNumber($('[data-oc]')?.value) || 1;
    const k = parseFloat($('[data-ok]')?.value) || 18;
    const dollar = window.API.getById('dollar');
    if(!dollar || dollar.price == null) return;

    const totalUSD = ounce.price * n;
    const totalRial = totalUSD * dollar.price;
    const gramPrice = totalRial / 31.1035;
    const gramK = gramPrice * (k / 24);

    const out = $('[data-ounce-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>ارزش دلاری</span><strong>$${formatNumber(totalUSD, 2)}</strong></div>
      <div class="result-row"><span>ارزش ${unitLabel()}</span><strong>${money(totalRial)}</strong></div>
      <div class="result-row"><span>هر گرم ۲۴ عیار</span><strong>${money(gramPrice)}</strong></div>
      <div class="result-row result-total"><span>هر گرم ${k} عیار</span><strong>${money(gramK)}</strong></div>
    `;
  }
  $$('[data-oc],[data-ok]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
}

function toolSilver(){
  const silver = window.API.getById('silver');
  if(!silver || silver.price == null){ toast('در حال دریافت قیمت...', 'warning'); return; }

  openModal(`<span data-icon="diamond"></span> محاسبه‌گر نقره`, `
    <div class="form-group">
      <label>وزن (گرم)</label>
      <input class="input" type="text" inputmode="decimal" value="100" data-money data-sv aria-label="وزن نقره">
    </div>
    <div class="result-box" data-silver-out></div>
  `);

  function calc(){
    const w = parseFormattedNumber($('[data-sv]')?.value) || 0;
    const dollar = window.API.getById('dollar');
    if(!dollar || dollar.price == null) return;
    const pricePerGram = (silver.price * dollar.price) / 31.1035;
    const total = w * pricePerGram;

    const out = $('[data-silver-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>هر گرم</span><strong>${money(pricePerGram)}</strong></div>
      <div class="result-row result-total"><span>ارزش ${formatNumber(w, 0)} گرم</span><strong>${money(total)}</strong></div>
    `;
  }
  $('[data-sv]')?.addEventListener('input', calc);
  calc();
}

function toolConv(){
  const currencies = window.DATA.ASSETS.filter(a => a.cat === 'currency' || a.id === 'ounce' || a.id === 'gold18');
  const opts = currencies.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  openModal(`<span data-icon="exchange"></span> مبدل ارز`, `
    <div class="form-group">
      <label>مقدار (${unitLabel()})</label>
      <input class="input" type="text" inputmode="decimal" value="1000000" data-money data-va aria-label="مقدار">
    </div>
    <div style="display:grid;grid-template-columns:1fr 44px 1fr;gap:9px;align-items:center">
      <select class="select" data-vf aria-label="از واحد">${opts}</select>
      <button type="button" class="btn btn-primary" data-vs style="padding:9px;width:44px;height:44px;border-radius:13px" aria-label="جابجایی">⇄</button>
      <select class="select" data-vt aria-label="به واحد">${opts}</select>
    </div>
    <div class="result-box" data-conv-out></div>
  `);

  const selF = $('[data-vf]');
  const selT = $('[data-vt]');
  if(selF) selF.value = 'dollar';
  if(selT) selT.value = 'euro';

  function calc(){
    const userAmt = parseFormattedNumber($('[data-va]')?.value) || 0;
    const amtBase = userToBase(userAmt);
    const f = window.DATA.find($('[data-vf]')?.value);
    const t = window.DATA.find($('[data-vt]')?.value);
    if(!f || !t) return;
    const lf = window.API.getById(f.id);
    const lt = window.API.getById(t.id);
    const out = $('[data-conv-out]');
    if(!lf || !lt || lf.price == null || lt.price == null){
      if(out) out.innerHTML = '<div class="result-row"><span>در حال دریافت...</span></div>';
      return;
    }
    const res = (amtBase * lf.price) / lt.price;
    if(out) out.innerHTML = `
      <div class="result-row"><span>${formatNumber(userAmt, 2)} ${f.code}</span><strong>${formatNumber(res, 4)} ${t.code}</strong></div>
      <div class="result-row"><span>نرخ تبدیل</span><strong>۱ ${f.code} = ${formatNumber(lf.price / lt.price, 4)} ${t.code}</strong></div>
    `;
  }
  $$('[data-va],[data-vf],[data-vt]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  $('[data-vs]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const a = selF.value;
    selF.value = selT.value;
    selT.value = a;
    calc();
  });
  calc();
}

function toolCryptoConv(){
  const cryptos = window.DATA.ASSETS.filter(a => a.cat === 'crypto');
  const opts = cryptos.map(a => `<option value="${a.id}">${a.name} (${a.code})</option>`).join('');

  openModal(`<span data-icon="bitcoin"></span> مبدل کریپتو`, `
    <div class="form-group">
      <label>مقدار</label>
      <input class="input" type="text" inputmode="decimal" value="1" data-money data-cca aria-label="مقدار">
    </div>
    <div style="display:grid;grid-template-columns:1fr 44px 1fr;gap:9px;align-items:center">
      <select class="select" data-ccf aria-label="از کریپتو">${opts}</select>
      <button type="button" class="btn btn-primary" data-ccs style="padding:9px;width:44px;height:44px;border-radius:13px" aria-label="جابجایی">⇄</button>
      <select class="select" data-cct aria-label="به کریپتو">${opts}</select>
    </div>
    <div class="result-box" data-crypto-out></div>
  `);

  const f = $('[data-ccf]');
  const t = $('[data-cct]');
  if(f) f.value = 'btc';
  if(t) t.value = 'usdt';

  function calc(){
    const amt = parseFormattedNumber($('[data-cca]')?.value) || 0;
    const from = window.DATA.find($('[data-ccf]')?.value);
    const to = window.DATA.find($('[data-cct]')?.value);
    if(!from || !to) return;
    const lf = window.API.getById(from.id);
    const lt = window.API.getById(to.id);
    const out = $('[data-crypto-out]');
    if(!lf || !lt || lf.price == null || lt.price == null){
      if(out) out.innerHTML = '<div class="result-row"><span>در حال دریافت...</span></div>';
      return;
    }
    const res = (amt * lf.price) / lt.price;
    const usdVal = amt * lf.price;
    const dollar = window.API.getById('dollar');
    const tomanVal = dollar ? usdVal * dollar.price : 0;

    if(out) out.innerHTML = `
      <div class="result-row"><span>${formatNumber(amt, 4)} ${from.code}</span><strong>${formatNumber(res, 6)} ${to.code}</strong></div>
      <div class="result-row"><span>ارزش دلاری</span><strong>$${formatNumber(usdVal, 2)}</strong></div>
      ${tomanVal ? `<div class="result-row result-total"><span>ارزش ${unitLabel()}</span><strong>${money(tomanVal)}</strong></div>` : ''}
    `;
  }
  $$('[data-cca],[data-ccf],[data-cct]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  $('[data-ccs]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const a = f.value;
    f.value = t.value;
    t.value = a;
    calc();
  });
  calc();
}

function toolUnitConv(){
  openModal(`<span data-icon="swap"></span> مبدل واحد و حجم`, `
    <div class="form-group">
      <label>دسته</label>
      <select class="select" data-ucat aria-label="دسته واحد">
        <option value="weight">وزن</option>
        <option value="length">طول</option>
        <option value="volume">حجم</option>
        <option value="area">سطح</option>
      </select>
    </div>
    <div class="form-group">
      <label>مقدار</label>
      <input class="input" type="text" inputmode="decimal" value="1" data-money data-ua aria-label="مقدار">
    </div>
    <div style="display:grid;grid-template-columns:1fr 44px 1fr;gap:9px;align-items:center">
      <select class="select" data-uf aria-label="از واحد"></select>
      <button type="button" class="btn btn-primary" data-us style="padding:9px;width:44px;height:44px;border-radius:13px" aria-label="جابجایی">⇄</button>
      <select class="select" data-ut aria-label="به واحد"></select>
    </div>
    <div class="result-box" data-unit-out></div>
  `);

  const units = {
    weight: {
      label: 'وزن',
      units: {
        gram:    { name: 'گرم',        factor: 1 },
        kg:      { name: 'کیلوگرم',    factor: 1000 },
        mg:      { name: 'میلی‌گرم',   factor: 0.001 },
        ton:     { name: 'تن',          factor: 1000000 },
        mesghal: { name: 'مثقال',      factor: 4.6083 },
        ounce:   { name: 'انس',         factor: 31.1035 },
        pound:   { name: 'پوند',        factor: 453.592 },
        carat:   { name: 'قیراط',      factor: 0.2 }
      }
    },
    length: {
      label: 'طول',
      units: {
        meter:   { name: 'متر',         factor: 1 },
        cm:      { name: 'سانتی‌متر',   factor: 0.01 },
        mm:      { name: 'میلی‌متر',   factor: 0.001 },
        km:      { name: 'کیلومتر',    factor: 1000 },
        inch:    { name: 'اینچ',        factor: 0.0254 },
        foot:    { name: 'فوت',         factor: 0.3048 },
        yard:    { name: 'یارد',        factor: 0.9144 },
        mile:    { name: 'مایل',        factor: 1609.344 }
      }
    },
    volume: {
      label: 'حجم',
      units: {
        liter:       { name: 'لیتر',           factor: 1 },
        ml:          { name: 'میلی‌لیتر',      factor: 0.001 },
        m3:          { name: 'متر مکعب',       factor: 1000 },
        gallon_us:   { name: 'گالن آمریکایی',  factor: 3.785411784 },
        gallon_uk:   { name: 'گالن انگلیسی',   factor: 4.54609 },
        barrel_oil:  { name: 'بشکه نفت',       factor: 158.987294928 },
        barrel:      { name: 'بشکه',           factor: 119.240471196 },
        cubic_inch:  { name: 'اینچ مکعب',      factor: 0.016387064 },
        cubic_ft:    { name: 'فوت مکعب',       factor: 28.316846592 }
      }
    },
    area: {
      label: 'سطح',
      units: {
        m2:      { name: 'متر مربع',    factor: 1 },
        cm2:     { name: 'سانتی‌متر مربع', factor: 0.0001 },
        km2:     { name: 'کیلومتر مربع', factor: 1000000 },
        hectare: { name: 'هکتار',       factor: 10000 },
        ft2:     { name: 'فوت مربع',    factor: 0.092903 },
        acre:    { name: 'جریب',        factor: 4046.86 }
      }
    }
  };

  function getLabels(catKey){
    const cat = units[catKey];
    return Object.entries(cat.units).map(([k, v]) =>
      `<option value="${k}">${v.name}</option>`
    ).join('');
  }

  function updateSelects(){
    const catKey = $('[data-ucat]')?.value || 'weight';
    const fSel = $('[data-uf]');
    const tSel = $('[data-ut]');
    if(!fSel || !tSel) return;

    const html = getLabels(catKey);
    fSel.innerHTML = html;
    tSel.innerHTML = html;

    if(catKey === 'weight'){ fSel.value = 'gram'; tSel.value = 'mesghal'; }
    else if(catKey === 'length'){ fSel.value = 'meter'; tSel.value = 'foot'; }
    else if(catKey === 'volume'){ fSel.value = 'liter'; tSel.value = 'gallon_us'; }
    else if(catKey === 'area'){ fSel.value = 'm2'; tSel.value = 'ft2'; }
    calc();
  }

  function calc(){
    const catKey = $('[data-ucat]')?.value || 'weight';
    const cat = units[catKey];
    const amt = parseFormattedNumber($('[data-ua]')?.value) || 0;
    const from = $('[data-uf]')?.value;
    const to = $('[data-ut]')?.value;
    if(!from || !to || !cat.units[from] || !cat.units[to]) return;

    const inBase = amt * cat.units[from].factor;
    const res = inBase / cat.units[to].factor;

    const out = $('[data-unit-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>دسته</span><strong>${cat.label}</strong></div>
      <div class="result-row"><span>مقدار ورودی</span><strong>${formatNumber(amt, 4)} ${cat.units[from].name}</strong></div>
      <div class="result-row result-total"><span>معادل</span><strong>${formatNumber(res, 4)} ${cat.units[to].name}</strong></div>
    `;
  }

  $('[data-ucat]')?.addEventListener('change', updateSelects);
  $$('[data-ua],[data-uf],[data-ut]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  $('[data-us]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const f = $('[data-uf]');
    const t = $('[data-ut]');
    const a = f.value;
    f.value = t.value;
    t.value = a;
    calc();
  });

  updateSelects();
}

function toolPortfolio(){
  openModal(`<span data-icon="briefcase"></span> پرتفوی من`, `
    <div class="form-group">
      <label>نماد</label>
      <select class="select" data-pa aria-label="نماد">
        ${window.DATA.ASSETS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>مقدار</label>
        <input class="input" type="text" inputmode="decimal" placeholder="۱۰" data-money data-pq aria-label="مقدار">
      </div>
      <div class="form-group">
        <label>قیمت خرید (${unitLabel()})</label>
        <input class="input" type="text" inputmode="decimal" placeholder="خودکار" data-money data-pp aria-label="قیمت خرید">
      </div>
    </div>
    <button type="button" class="btn btn-primary btn-block" data-padd>
      <span data-icon="plus"></span>
      افزودن به پرتفوی
    </button>
    <div style="margin-top:14px" data-pf-list></div>
  `);

  function render(){
    const list = window.Storage.pf.get();
    const el = $('[data-pf-list]');
    if(!el) return;
    if(!list.length){
      el.innerHTML = '<div class="empty"><h3>هنوز دارایی اضافه نکرده‌اید</h3></div>';
      return;
    }
    el.innerHTML = list.map(item => {
      const a = window.DATA.find(item.id);
      const l = window.API.getById(item.id);
      if(!a) return '';
      const price = (l && l.price != null) ? l.price : item.buyPrice;
      const nv = price * item.qty;
      const bv = item.buyPrice * item.qty;
      const pl = nv - bv;
      const pct = bv > 0 ? (pl / bv) * 100 : 0;
      return `
        <div class="result-row" style="padding:10px;border-radius:11px;background:var(--card-2);margin-bottom:7px">
          <div style="display:flex;align-items:center;gap:9px">
            <div class="m-card-icon" style="width:30px;height:30px;border-radius:9px">
              ${assetIcon(a)}
            </div>
            <div>
              <strong style="display:block;font-size:12.5px">${window.U.esc(a.name)}</strong>
              <small style="font-size:10.5px;color:var(--muted)">${formatNumber(item.qty, 0)} × ${formatPrice(a, item.buyPrice)}</small>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:9px">
            <div style="text-align:end">
              <strong style="display:block;font-size:12.5px;direction:ltr">${formatPrice(a, nv)}</strong>
              <small style="color:${pl >= 0 ? 'var(--up)' : 'var(--down)'};font-weight:800;direction:ltr">
                ${pl >= 0 ? '+' : ''}${pct.toFixed(2)}%
              </small>
            </div>
            <button type="button" class="icon-btn" data-pf-del2="${item.ts}"
              title="حذف" aria-label="حذف دارایی"
              style="width:26px;height:26px;color:var(--muted)">
              ${window.Icons.get('trash')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('[data-pf-del2]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const ts = +btn.dataset.pfDel2;
        window.Storage.pf.save(window.Storage.pf.get().filter(x => x.ts !== ts));
        render();
        renderBankCard();
      });
    });
  }

  $('[data-padd]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const id = $('[data-pa]')?.value;
    const pqEl = $('[data-pq]');
    const ppEl = $('[data-pp]');
    const qty = validatePositive(pqEl, 'مقدار');
    if(!id || qty == null) return;

    const ppUser = parseFormattedNumber(ppEl?.value);
    let buyBase;
    if(ppUser && !isNaN(ppUser) && ppUser > 0){
      buyBase = userToBase(ppUser);
    } else {
      const l = window.API.getById(id);
      if(!l || l.price == null){ toast('قیمت در دسترس نیست', 'error'); return; }
      buyBase = l.price;
    }

    const list = window.Storage.pf.get();
    list.push({ id, qty, buyPrice: buyBase, ts: Date.now() });
    window.Storage.pf.save(list);
    render();
    renderBankCard();
    if(pqEl) pqEl.value = '';
    if(ppEl) ppEl.value = '';
    clearFieldError(pqEl);
    clearFieldError(ppEl);
    toast('اضافه شد ✓', 'success');
  });

  render();
}

function toolAlerts(){
  openModal(`<span data-icon="bell"></span> هشدار قیمت`, `
    <div class="form-group">
      <label>نماد</label>
      <select class="select" data-al-a aria-label="نماد">
        ${window.DATA.ASSETS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>بالاتر از (${unitLabel()})</label>
        <input class="input" type="text" inputmode="decimal" data-money data-al-up aria-label="بالاتر از">
      </div>
      <div class="form-group">
        <label>پایین‌تر از (${unitLabel()})</label>
        <input class="input" type="text" inputmode="decimal" data-money data-al-dn aria-label="پایین‌تر از">
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:7px;margin:11px 0;font-size:12px;color:var(--muted)">
      <input type="checkbox" data-al-repeat checked>
      هشدار تکرارشونده
    </label>
    <button type="button" class="btn btn-primary btn-block" data-al-save>
      <span data-icon="plus"></span>
      ذخیره هشدار
    </button>
    <div style="margin-top:14px" data-al-list></div>
  `);

  function render(){
    const list = window.Storage.alerts.get();
    const el = $('[data-al-list]');
    if(!el) return;
    if(!list.length){
      el.innerHTML = '<div class="empty"><h3>هشداری فعال نیست</h3></div>';
      return;
    }
    el.innerHTML = list.map(al => {
      const a = window.DATA.find(al.id);
      const parts = [];
      if(al.up) parts.push('بالاتر از ' + money(al.up));
      if(al.dn) parts.push('پایین‌تر از ' + money(al.dn));
      const repeatBadge = al.repeat !== false
        ? '<span style="font-size:9.5px;background:var(--accent-soft);color:var(--accent);padding:2px 6px;border-radius:5px;margin-right:5px">تکرارشونده</span>'
        : '';
      return `
        <div class="result-row" style="padding:9px;border-radius:10px;background:var(--card-2);margin-bottom:5px">
          <span>${window.U.esc(a?.name || '—')} — ${parts.join(' / ')} ${repeatBadge}</span>
          <button type="button" class="icon-btn" data-al-del="${al.ts}"
            title="حذف" aria-label="حذف هشدار"
            style="width:26px;height:26px;color:var(--muted)">
            ${window.Icons.get('trash')}
          </button>
        </div>
      `;
    }).join('');

    el.querySelectorAll('[data-al-del]').forEach(b => {
      b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const ts = +b.dataset.alDel;
        window.Storage.alerts.save(window.Storage.alerts.get().filter(x => x.ts !== ts));
        render();
      });
    });
  }

  $('[data-al-save]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const id = $('[data-al-a]')?.value;
    const upUser = parseFormattedNumber($('[data-al-up]')?.value);
    const dnUser = parseFormattedNumber($('[data-al-dn]')?.value);
    if(!id || (upUser == null && dnUser == null)){ toast('حداقل یک شرط وارد کنید', 'error'); return; }
    const up = upUser != null ? userToBase(upUser) : null;
    const dn = dnUser != null ? userToBase(dnUser) : null;
    const repeat = $('[data-al-repeat]')?.checked !== false;
    const list = window.Storage.alerts.get();
    list.push({ id, up, dn, repeat, ts: Date.now() });
    window.Storage.alerts.save(list);
    render();
    toast('ذخیره شد ✓', 'success');
  });

  render();
}

function toolNotes(){
  const notes = window.Storage.notes.get() || '';
  openModal(`<span data-icon="note"></span> یادداشت‌ها`, `
    <textarea class="textarea" data-notes placeholder="یادداشت خود را بنویسید..." style="min-height:200px" aria-label="یادداشت">${notes}</textarea>
    <button type="button" class="btn btn-primary btn-block" data-notes-save>
      <span data-icon="check"></span>
      ذخیره
    </button>
  `);
  $('[data-notes-save]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const val = $('[data-notes]')?.value || '';
    window.Storage.notes.save(val);
    closeModal();
    toast('ذخیره شد ✓', 'success');
  });
}

function toolProfit(){
  const opts = window.DATA.ASSETS.slice(0, 50).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  openModal(`<span data-icon="trendingUp"></span> محاسبه سود / زیان`, `
    <div class="form-group">
      <label>دارایی</label>
      <select class="select" data-pr-a aria-label="دارایی">${opts}</select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>قیمت خرید (${unitLabel()})</label>
        <input class="input" type="text" inputmode="decimal" placeholder="قیمت واحد" data-money data-pr-buy aria-label="قیمت خرید">
      </div>
      <div class="form-group">
        <label>مقدار</label>
        <input class="input" type="text" inputmode="decimal" value="1" data-money data-pr-qty aria-label="مقدار">
      </div>
    </div>
    <div class="result-box" data-profit-out></div>
  `);

  function calc(){
    const id = $('[data-pr-a]')?.value;
    const buyUser = parseFormattedNumber($('[data-pr-buy]')?.value) || 0;
    const buyBase = userToBase(buyUser);
    const qty = parseFormattedNumber($('[data-pr-qty]')?.value) || 0;
    const a = window.DATA.find(id);
    const l = window.API.getById(id);
    const out = $('[data-profit-out]');
    if(!a || !l || l.price == null || !buyBase || !qty){
      if(out) out.innerHTML = '<div class="result-row"><span>قیمت خرید و مقدار را وارد کنید</span></div>';
      return;
    }
    const nowVal = l.price * qty;
    const buyVal = buyBase * qty;
    const pl = nowVal - buyVal;
    const pct = buyVal > 0 ? (pl / buyVal) * 100 : 0;
    const up = pl >= 0;

    if(out) out.innerHTML = `
      <div class="result-row"><span>ارزش خرید</span><strong>${formatPrice(a, buyVal)}</strong></div>
      <div class="result-row"><span>ارزش فعلی</span><strong>${formatPrice(a, nowVal)}</strong></div>
      <div class="result-row result-total">
        <span>${up ? 'سود' : 'زیان'}</span>
        <strong style="color:${up ? 'var(--up)' : 'var(--down)'}">
          ${up ? '+' : ''}${formatPrice(a, Math.abs(pl))} (${up ? '+' : ''}${pct.toFixed(2)}%)
        </strong>
      </div>
    `;
  }
  $$('[data-pr-a],[data-pr-buy],[data-pr-qty]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
}

function toolZakat(){
  const gold = window.API.getById('gold18');
  if(!gold || gold.price == null){ toast('در حال دریافت...', 'warning'); return; }

  openModal(`<span data-icon="check"></span> محاسبه زکات طلا`, `
    <div class="form-grid">
      <div class="form-group">
        <label>وزن طلا (گرم)</label>
        <input class="input" type="text" inputmode="decimal" value="100" data-money data-zw aria-label="وزن طلا">
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-zk aria-label="عیار">
          <option value="18" selected>۱۸ عیار</option>
          <option value="24">۲۴ عیار</option>
          <option value="21">۲۱ عیار</option>
          <option value="14">۱۴ عیار</option>
        </select>
      </div>
    </div>
    <div class="result-box" data-zakat-out></div>
  `);

  const NISAB_GRAM_24K = 87.48;

  function calc(){
    const w = parseFormattedNumber($('[data-zw]')?.value) || 0;
    const k = parseFloat($('[data-zk]')?.value) || 18;
    const w24 = w * (k / 24);
    const out = $('[data-zakat-out]');
    const reached = w24 >= NISAB_GRAM_24K;

    if(!reached){
      if(out) out.innerHTML = `
        <div class="result-row"><span>معادل ۲۴ عیار</span><strong>${formatNumber(w24, 2)} گرم</strong></div>
        <div class="result-row"><span>نصاب شرعی</span><strong>${formatNumber(NISAB_GRAM_24K, 2)} گرم</strong></div>
        <div class="result-row result-total"><span>وضعیت</span><strong style="color:var(--warn)">به نصاب نرسیده</strong></div>
      `;
      return;
    }

    const pricePerGram = gold.price * (k / 18);
    const totalValue = w * pricePerGram;
    const zakat = totalValue * 0.025;

    if(out) out.innerHTML = `
      <div class="result-row"><span>معادل ۲۴ عیار</span><strong>${formatNumber(w24, 2)} گرم</strong></div>
      <div class="result-row"><span>ارزش کل</span><strong>${money(totalValue)}</strong></div>
      <div class="result-row"><span>نرخ زکات</span><strong>۲.۵٪</strong></div>
      <div class="result-row result-total"><span>زکات واجب</span><strong>${money(zakat)}</strong></div>
    `;
  }
  $$('[data-zw],[data-zk]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  calc();
}

function toolAvgBuy(){
  const opts = window.DATA.ASSETS.slice(0, 50).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  openModal(`<span data-icon="barChart"></span> میانگین خرید`, `
    <div class="form-group">
      <label>دارایی</label>
      <select class="select" data-avg-a aria-label="دارایی">${opts}</select>
    </div>
    <div id="avg-rows"></div>
    <button type="button" class="btn btn-ghost btn-block" data-avg-add style="margin-top:7px">
      <span data-icon="plus"></span>
      افزودن ردیف
    </button>
    <div class="result-box" data-avg-out></div>
  `);

  function addRow(){
    const wrap = $('#avg-rows');
    if(!wrap) return;
    const row = document.createElement('div');
    row.setAttribute('data-avg-row', '');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 36px;gap:7px;margin-bottom:7px';
    row.innerHTML = `
      <input class="input" type="text" inputmode="decimal" placeholder="قیمت (${unitLabel()})" data-money data-avg-p aria-label="قیمت">
      <input class="input" type="text" inputmode="decimal" placeholder="مقدار" data-money data-avg-q aria-label="مقدار">
      <button type="button" class="btn btn-danger" data-avg-del style="padding:0;width:36px;font-size:16px" title="حذف ردیف" aria-label="حذف ردیف">×</button>
    `;
    wrap.appendChild(row);
    row.querySelectorAll('input').forEach(i => i.addEventListener('input', calc));
    row.querySelector('[data-avg-del]')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if($$('[data-avg-row]').length > 1){
        row.remove();
        calc();
      }
    });
    calc();
  }

  function calc(){
    const id = $('[data-avg-a]')?.value;
    const a = window.DATA.find(id);
    if(!a) return;

    let totalQty = 0, totalCost = 0;
    $$('[data-avg-row]').forEach(row => {
      const pUser = parseFormattedNumber(row.querySelector('[data-avg-p]')?.value) || 0;
      const p = userToBase(pUser);
      const q = parseFormattedNumber(row.querySelector('[data-avg-q]')?.value) || 0;
      totalQty += q;
      totalCost += p * q;
    });

    const avg = totalQty > 0 ? totalCost / totalQty : 0;
    const l = window.API.getById(id);
    const nowVal = (l && l.price != null) ? l.price * totalQty : 0;
    const pl = nowVal - totalCost;
    const pct = totalCost > 0 ? (pl / totalCost) * 100 : 0;

    const out = $('[data-avg-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>مجموع مقدار</span><strong>${formatNumber(totalQty, 4)}</strong></div>
      <div class="result-row"><span>مجموع هزینه</span><strong>${formatPrice(a, totalCost)}</strong></div>
      <div class="result-row"><span>میانگین خرید</span><strong>${formatPrice(a, avg)}</strong></div>
      ${l && l.price != null ? `
        <div class="result-row"><span>قیمت فعلی</span><strong>${formatPrice(a, l.price)}</strong></div>
        <div class="result-row result-total">
          <span>سود / زیان</span>
          <strong style="color:${pl >= 0 ? 'var(--up)' : 'var(--down)'}">
            ${pl >= 0 ? '+' : ''}${pct.toFixed(2)}%
          </strong>
        </div>
      ` : ''}
    `;
  }

  $('[data-avg-add]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    addRow();
  });
  $('[data-avg-a]')?.addEventListener('change', calc);
  addRow();
}

function openTool(tool){
  if(tool === 'gold') toolGold();
  else if(tool === 'coin') toolCoin();
  else if(tool === 'ounce') toolOunce();
  else if(tool === 'silver') toolSilver();
  else if(tool === 'conv') toolConv();
  else if(tool === 'crypto-conv') toolCryptoConv();
  else if(tool === 'unit-conv') toolUnitConv();
  else if(tool === 'volume-conv') toolUnitConv();
  else if(tool === 'portfolio') toolPortfolio();
  else if(tool === 'alerts') toolAlerts();
  else if(tool === 'notes') toolNotes();
  else if(tool === 'profit') toolProfit();
  else if(tool === 'zakat') toolZakat();
  else if(tool === 'avg') toolAvgBuy();
  else if(tool === 'tv'){
    if(window.TV){
      if(TV.isActive()) TV.close();
      else TV.open();
    } else {
      toast('حالت TV در دسترس نیست', 'warning');
    }
  }
  else if(tool === 'fullscreen'){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }
  else if(tool === 'export'){
    const btn = document.querySelector('[data-action="export"]');
    if(btn) btn.click();
  }
}

/* ============================================================
   جستجوی ترکیبی — نمادها + خودروها
============================================================ */
function doSearch(query){
  const res = $('[data-search-results]');
  if(!res) return;

  const q = (query || '').trim().toLowerCase();

  if(!q || q.length < 2){
    res.hidden = true;
    res.innerHTML = '';
    return;
  }

  /* ═══ جستجو در نمادها ═══ */
  const symbolList = window.DATA.ASSETS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.id.toLowerCase().includes(q)
  ).slice(0, 8);

  /* ═══ جستجو در خودروها ═══ */
  let carList = [];
  if(window.API && window.API.getCars){
    const cars = window.API.getCars();
    if(cars && cars.cars){
      carList = cars.cars.filter(function(c){
        return (c.name || '').toLowerCase().includes(q) ||
               (c.category || '').toLowerCase().includes(q);
      }).slice(0, 6);
    }
  }

  const hasSymbols = symbolList.length > 0;
  const hasCars = carList.length > 0;

  if(!hasSymbols && !hasCars){
    res.innerHTML = '<div class="ms-empty">نتیجه‌ای یافت نشد</div>';
    res.hidden = false;
    return;
  }

  let html = '';

  /* ═══ بخش نمادها ═══ */
  if(hasSymbols){
    html += '<div class="ms-section-title">نمادها</div>';
    html += symbolList.map(function(a, i){
      const live = window.API && window.API.getById ? window.API.getById(a.id) : null;
      const price = live && live.price != null ? formatPrice(a, live.price) : '—';
      return `
        <div class="ms-item" data-search-kind="symbol" data-idx="${i}" role="button" tabindex="0">
          <div class="ms-item-icon">${assetIcon(a)}</div>
          <div class="ms-item-info">
            <strong>${window.U.esc(a.name)}</strong>
            <small>${a.code} · ${window.DATA.CATEGORIES[a.cat]?.label || ''}</small>
          </div>
          <div class="ms-item-price">${price}</div>
        </div>
      `;
    }).join('');
  }

  /* ═══ بخش خودروها ═══ */
  if(hasCars){
    html += '<div class="ms-section-title">خودروها</div>';
    html += carList.map(function(c, i){
      const priceValue = c.priceMarket != null ? c.priceMarket
                       : c.priceFactory != null ? c.priceFactory
                       : null;
      const priceText = priceValue != null
        ? formatPrice({ ptype: 'rial', dec: 0 }, priceValue)
        : (c.status === 'coming-soon' ? 'به زودی'
          : c.status === 'unavailable' ? 'ناموجود'
          : c.status === 'discontinued' ? 'توقف تولید'
          : c.status === 'not-selling' ? 'توقف فروش'
          : '—');
      const statusLabel = c.status === 'available' ? 'موجود'
                        : c.status === 'coming-soon' ? 'به زودی'
                        : c.status === 'unavailable' ? 'ناموجود'
                        : c.status === 'discontinued' ? 'توقف تولید'
                        : c.status === 'not-selling' ? 'توقف فروش'
                        : '';
      return `
        <div class="ms-item" data-search-kind="car" data-idx="${i}" role="button" tabindex="0">
          <div class="ms-item-icon" style="background:var(--card-2);color:var(--accent)">
            <span data-icon="car"></span>
          </div>
          <div class="ms-item-info">
            <strong>${window.U.esc(c.name || '—')}</strong>
            <small>${window.U.esc(c.category || '')} ${statusLabel ? '· ' + statusLabel : ''}</small>
          </div>
          <div class="ms-item-price">${priceText}</div>
        </div>
      `;
    }).join('');
  }

  res.innerHTML = html;
  res.hidden = false;

  /* ═══ اتصال رویدادها ═══ */
  res.querySelectorAll('.ms-item').forEach(function(el){
    el.addEventListener('click', function(e){
      e.stopPropagation();
      const kind = el.dataset.searchKind;
      const idx = +el.dataset.idx;
      if(kind === 'symbol'){
        pickSearch(symbolList[idx]);
      } else if(kind === 'car'){
        pickSearchCar(carList[idx]);
      }
    });
  });

  if(window.Icons && window.Icons.hydrate){
    window.Icons.hydrate(res);
  }
}

function pickSearch(asset){
  if(!asset) return;
  activeChartId = asset.id;
  closeSearch();
  go('chart');
}

function pickSearchCar(car){
  if(!car) return;
  carsSearch = car.name || '';
  closeSearch();
  go('cars');
  setTimeout(() => {
    openCarModal(car.id);
  }, 400);
}

function closeSearch(){
  const res = $('[data-search-results]');
  if(res){
    res.hidden = true;
    res.innerHTML = '';
  }
  const input = $('[data-search-input]');
  if(input) input.value = '';
}

/* ============================================================
   CLICK HANDLER
============================================================ */
function handleClick(e){
  const menuBtn = e.target.closest('[data-menu]');
  if(menuBtn){
    e.preventDefault();
    e.stopPropagation();
    if(window.TV && window.TV.isActive()){ window.TV.close(); return; }
    document.body.classList.toggle('sidebar-open');
    return;
  }

  if(e.target.closest('[data-backdrop]')){
    e.preventDefault();
    document.body.classList.remove('sidebar-open');
    return;
  }

  const refreshBtn = e.target.closest('[data-action="refresh"]');
  if(refreshBtn){
    e.preventDefault();
    e.stopPropagation();
    if(refreshBtn.dataset.loading === '1') return;
    refreshBtn.dataset.loading = '1';
    refreshBtn.classList.add('is-loading');
    window.API.fetchData(true).then(() => {
      toast('بروزرسانی شد ✓', 'success');
    }).catch(() => {
      toast('خطا در بروزرسانی', 'error');
    }).finally(() => {
      refreshBtn.dataset.loading = '';
      refreshBtn.classList.remove('is-loading');
    });
    return;
  }

  /* ═══ بستن نتایج جستجو ═══ */
  const results = $('[data-search-results]');
  if(results && !results.hidden){
    if(!e.target.closest('.hdr-search-wrap')) closeSearch();
  }

  if(e.target.closest('[data-modal-close]')){
    e.preventDefault();
    e.stopPropagation();
    closeModal();
    return;
  }

  const tvBtn = e.target.closest('[data-tool="tv"]');
  if(tvBtn){
    e.preventDefault();
    e.stopPropagation();
    if(window.TV){
      if(window.TV.isActive()) window.TV.close();
      else {
        document.body.classList.remove('sidebar-open');
        window.TV.open();
      }
    }
    return;
  }

  const favBtn = e.target.closest('[data-fav-toggle]');
  if(favBtn){
    e.preventDefault();
    e.stopPropagation();
    const id = favBtn.dataset.favToggle;
    window.Storage.fav.toggle(id);
    toast('علاقه‌مندی بروزرسانی شد', 'success');
    if(currentPage === 'favorites') renderFavs();
    else if(currentPage === 'markets') renderMarkets();
    else if(currentPage === 'home'){
      renderFeatured();
      renderMostUsed();
      renderLiveStrip();
    }
    else if(currentPage === 'chart'){ renderChartPage().catch(function(){}); }
    return;
  }

  const pfDel = e.target.closest('[data-pf-del]');
  if(pfDel){
    e.preventDefault();
    e.stopPropagation();
    const ts = +pfDel.dataset.pfDel;
    window.Storage.pf.save(window.Storage.pf.get().filter(x => x.ts !== ts));
    renderBankCard();
    toast('حذف شد', 'success');
    return;
  }

  const carCard = e.target.closest('[data-car-id]');
  if(carCard){
    e.preventDefault();
    e.stopPropagation();
    openCarModal(carCard.dataset.carId);
    return;
  }

  const card = e.target.closest('[data-card-id]');
  if(card){
    if(card.classList.contains('m-card-empty')) return;
    e.preventDefault();
    e.stopPropagation();
    activeChartId = card.dataset.cardId;
    go('chart');
    return;
  }

  const routeBtn = e.target.closest('[data-route]');
  if(routeBtn){
    e.preventDefault();
    e.stopPropagation();
    go(routeBtn.dataset.route);
    return;
  }

  const toolBtn = e.target.closest('[data-tool]');
  if(toolBtn){
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.remove('sidebar-open');
    openTool(toolBtn.dataset.tool);
    return;
  }

  /* ✅ دکمه تغییر حالت نمایش (Grid/List) */
  const viewBtn = e.target.closest('[data-view]');
  if(viewBtn){
    e.preventDefault();
    e.stopPropagation();
    marketView = viewBtn.dataset.view;
    window.CFG.set('marketView', marketView);

    $$('[data-view]').forEach(b =>
      b.classList.toggle('is-active', b.dataset.view === marketView)
    );

    const grid = $('[data-market-grid]');
    if(grid){
      grid.classList.toggle('view-list', marketView === 'list');
      /* ✅ بازسازی کارت‌ها برای سازگاری با حالت جدید */
      renderMarkets();
    }
    return;
  }

  const chip = e.target.closest('[data-filter]');
  if(chip){
    e.preventDefault();
    e.stopPropagation();
    $$('[data-filters] .chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    filter = chip.dataset.filter;
    renderMarkets();
    return;
  }

  const carChip = e.target.closest('[data-cars-filter]');
  if(carChip){
    e.preventDefault();
    e.stopPropagation();
    $$('[data-cars-filter]').forEach(c => c.classList.remove('is-active'));
    carChip.classList.add('is-active');
    carsFilter = carChip.dataset.carsFilter;
    renderCars().catch(function(){});
    return;
  }

  const unitBtn = e.target.closest('[data-unit]');
  if(unitBtn){
    e.preventDefault();
    e.stopPropagation();
    const newUnit = unitBtn.dataset.unit;
    if(getUnit() === newUnit) return;
    window.CFG.set('currency', newUnit);
    $$('[data-unit]').forEach(b => b.classList.toggle('is-active', b.dataset.unit === newUnit));
    /* ✅ پاک کردن کش اسپارک‌لاین */
    _sparkCache.clear();
    refreshAll();
    toast(newUnit === 'toman' ? 'واحد: تومان' : 'واحد: ریال', 'success');
    return;
  }

  const sw = e.target.closest('.switch');
  if(sw){
    e.preventDefault();
    e.stopPropagation();
    sw.classList.toggle('is-on');
    const k = sw.dataset.toggle;

    if(k === 'darkTheme'){
      const on = sw.classList.contains('is-on');
      window.CFG.set('theme', on ? 'dark' : 'light');
      document.body.classList.toggle('dark', on);

      try {
        localStorage.setItem('gheymato.cfg.v6', JSON.stringify(window.CFG._c));
      } catch(err){}
    }
    return;
  }

  const pill = e.target.closest('.pills button[data-period]');
  if(pill){
    e.preventDefault();
    e.stopPropagation();
    const parent = pill.parentElement;
    parent.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
    pill.classList.add('is-active');
    window.CFG.set('chartPeriod', pill.dataset.period);
    if(currentPage === 'chart') renderChartPage().catch(function(){});
    return;
  }

  if(e.target.closest('[data-action="reset"]')){
    e.preventDefault();
    e.stopPropagation();
    if(confirm('همه داده‌ها بازنشانی شود؟')){
      window.CFG.reset();
      window.Storage.clear();
      location.reload();
    }
    return;
  }

  if(e.target.closest('[data-action="export"]')){
    e.preventDefault();
    e.stopPropagation();
    const data = {
      cfg: window.CFG._c,
      fav: window.Storage.fav.get(),
      alerts: window.Storage.alerts.get(),
      pf: window.Storage.pf.get(),
      notes: window.Storage.notes.get(),
      userName: getUserName(),
      date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gheymato-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('دانلود شد ✓', 'success');
    return;
  }
}

/* ============================================================
   MONEY FORMATTER
============================================================ */
function attachMoneyFormatter(){
  document.addEventListener('input', function(e){
    const input = e.target;
    if(!input || input.tagName !== 'INPUT') return;
    if(!input.hasAttribute('data-money')) return;

    const start = input.selectionStart || 0;
    const oldVal = input.value;
    const num = parseFormattedNumber(oldVal);

    if(num == null){
      if(oldVal === '' || oldVal === '-') return;
      input.value = '';
      return;
    }

    const formatted = formatNumber(num, 0);
    if(formatted === oldVal) return;

    input.value = formatted;

    const diff = formatted.length - oldVal.length;
    const newPos = Math.max(0, Math.min(formatted.length, start + diff));
    try {
      input.setSelectionRange(newPos, newPos);
    } catch(err){}
  }, true);

  document.addEventListener('keypress', function(e){
    const input = e.target;
    if(!input || input.tagName !== 'INPUT') return;
    if(!input.hasAttribute('data-money')) return;

    const key = e.key;
    if(key && key.length === 1 && !/[\d۰-۹٠-٩.,\-]/.test(key)){
      e.preventDefault();
    }
  }, true);
}

/* ============================================================
   REFRESH ALL
============================================================ */
function refreshAll(){
  if(currentPage === 'home'){
    renderLiveStrip();
    renderBankCard();
    renderFeatured();
    renderMostUsed();
    renderCats();
    renderTools();
    renderCars().catch(function(){});
  }
  if(currentPage === 'markets') renderMarkets();
  if(currentPage === 'chart') renderChartPage().catch(function(){});
  if(currentPage === 'compare') renderCompare();
  if(currentPage === 'favorites') renderFavs();
  if(currentPage === 'cars') renderCars().catch(function(){});
  renderHdrTicker();
  if(window.TV && window.TV.isActive()) window.TV.refresh();
}

/* ============================================================
   CHECK ALERTS
============================================================ */
function checkAlerts(){
  const list = window.Storage.alerts.get();
  if(!list.length) return;
  const remaining = [];
  list.forEach(al => {
    const l = window.API.getById(al.id);
    if(!l || l.price == null){ remaining.push(al); return; }
    let fired = false;
    if(al.up && l.price >= al.up) fired = true;
    if(al.dn && l.price <= al.dn) fired = true;

    if(fired){
      const a = window.DATA.find(al.id);
      const name = a?.name || al.id;
      const direction = al.up && l.price >= al.up ? 'بالاتر از' : 'پایین‌تر از';
      toast('🔔 ' + name + ' ' + direction + ' حد تعیین‌شده', 'warning', 'alert_' + al.id + '_' + (al.up || al.dn));

      if(al.repeat !== false){
        remaining.push(al);
      }
    } else {
      remaining.push(al);
    }
  });
  if(remaining.length !== list.length) window.Storage.alerts.save(remaining);
}

/* ============================================================
   INIT
============================================================ */
function init(){
  disableAllGestures();

  window.CFG.load();
  document.body.classList.toggle('dark', window.CFG.get('theme') === 'dark');

  /* ✅ بازیابی حالت نمایش بازار */
  marketView = window.CFG.get('marketView') || 'grid';
  $$('[data-view]').forEach(b => 
    b.classList.toggle('is-active', b.dataset.view === marketView)
  );

  if(window.Icons && window.Icons.hydrate) window.Icons.hydrate();
  if(window.Icons && window.Icons.installImageFallback) window.Icons.installImageFallback();

  const unit = getUnit();
  $$('[data-unit]').forEach(b => b.classList.toggle('is-active', b.dataset.unit === unit));

  const unInput = $('[data-input="userName"]');
  if(unInput){
    unInput.value = getUserName() === 'کاربر مهمان' ? '' : getUserName();
    unInput.addEventListener('input', window.U.debounce(e => {
      const v = e.target.value.trim();
      saveUserName(v);
      if(currentPage === 'home') renderBankCard();
    }, 300));
  }

  const hash = (location.hash || '').replace('#', '');
  go(PAGES.includes(hash) ? hash : 'home');

  document.addEventListener('click', handleClick, true);

  document.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault();
      const input = $('[data-search-input]');
      if(input) input.focus();
    }
    if(e.key === 'Escape'){
      closeSearch();
      closeModal();
      document.body.classList.remove('sidebar-open');
    }
  });

  /* ═══ جستجوی نمادها ═══ */
  const si = $('[data-search-input]');
  if(si){
    si.addEventListener('input', window.U.debounce(e => doSearch(e.target.value), 150));
  }

  /* ═══ جستجوی خودروها ═══ */
  const cs = $('[data-cars-search]');
  if(cs){
    cs.addEventListener('input', window.U.debounce(function(e){
      carsSearch = e.target.value.trim();
      if(currentPage === 'cars'){
        renderCars().catch(function(){});
      }
    }, 250));
  }

  /* ═══ فیلتر خودروها ═══ */
  $$('[data-cars-filter]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      $$('[data-cars-filter]').forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      carsFilter = btn.dataset.carsFilter;
      if(currentPage === 'cars'){
        renderCars().catch(function(){});
      }
    });
  });

  attachMoneyFormatter();

  const iv = $('[data-input="interval"]');
  if(iv){
    iv.value = window.CFG.get('refreshInterval');
    iv.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      window.CFG.set('refreshInterval', v);
      window.API.stop();
      window.API.start(v);
      toast('فاصله: ' + (v / 1000) + 's', 'success');
    });
  }

  window.addEventListener('online', () => {
    window.API.fetchData(true).catch(() => {});
  });

  window.addEventListener('offline', () => {
    toast('حالت آفلاین', 'warning');
  });

  let refreshTimer = null;
  let lastRefreshHash = '';
  window.API.subscribe((data) => {
    const hash = data && data.updated ? data.updated : 'none';
    if(hash === lastRefreshHash) return;
    lastRefreshHash = hash;

    /* ✅ پاک کردن کش اسپارک‌لاین هنگام بروزرسانی */
    _sparkCache.clear();

    if(refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshAll();
      checkAlerts();
    }, 200);
  });

  renderHdrTicker();
}

/* ============================================================
   EXPORT
============================================================ */
return {
  init,
  go,
  toast,
  refreshAll,
  openModal,
  closeModal,
  closeSearch,
  renderChartPage,
  renderMarkets,
  renderFavs,
  renderBankCard,
  renderFeatured,
  renderMostUsed,
  renderTools,
  renderCats,
  renderHdrTicker,
  renderLiveStrip,
  drawSparkline,
  drawAllSparklines,
  getUserName,
  saveUserName,
  formatPrice,
  formatPriceWithUnit,
  fullUnitLabel,
  baseToUser,
  userToBase,
  formatNumber,
  parseFormattedNumber,
  openTool,
  toolGold,
  toolCoin,
  toolOunce,
  toolSilver,
  toolConv,
  toolCryptoConv,
  toolUnitConv,
  toolPortfolio,
  toolAlerts,
  toolNotes,
  toolProfit,
  toolZakat,
  toolAvgBuy,
  renderCars,
  carCardHTML,
  getCarImage,
  openCarModal,
  doSearch,
  disableAllGestures,
  checkAlerts
};

})();
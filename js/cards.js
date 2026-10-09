/**
 * قیمتو 8.0 — CARDS
 * ✅ کارت نماد (Grid + List)
 * ✅ کارت خودرو (Grid + List)
 * ✅ Live Strip
 * ✅ Long-press + Right-click → Context Menu
 * ✅ Copy Price / Copy Name / Share / Favorite / Chart
 * ✅ Event delegation سراسری
 */
window.Cards = (function(){
'use strict';

/* ═══════════════ STATE ═══════════════ */
let _longPressTimer = null;
let _pressingEl = null;
let _touchStartX = 0;
let _touchStartY = 0;
let _touchStartT = 0;
let _menuEl = null;
let _backdropEl = null;
let _toastEl = null;
let _currentAsset = null;
let _currentCar = null;

const LONG_PRESS_MS = 420;
const TOUCH_MOVE_TOLERANCE = 10;

/* ═══════════════ HELPERS ═══════════════ */
const $ = s => document.querySelector(s);

function esc(str){
  if(str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNumber(num, decimals){
  if(num == null || isNaN(num)) return '—';
  decimals = decimals || 0;
  const fixed = Number(num).toFixed(decimals);
  const parts = fixed.split('.');
  const sign = parts[0].startsWith('-') ? '-' : '';
  const intPart = parts[0].replace('-', '');
  const decPart = parts[1];
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let result = sign + withCommas;
  if(decPart) result += '.' + decPart;
  return result.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function getUnit(){
  return (window.CFG && window.CFG.get('currency')) || 'toman';
}

function unitLabel(){
  return getUnit() === 'toman' ? 'تومان' : 'ریال';
}

function baseToUser(value){
  if(value == null || isNaN(value)) return null;
  return getUnit() === 'toman' ? value / 10 : value;
}

function userToBase(value){
  if(value == null || isNaN(value)) return null;
  return getUnit() === 'toman' ? value * 10 : value;
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
  return formatNumber(val, d);
}

function priceUnitLabel(asset){
  if(!asset) return '';
  if(asset.ptype === 'usd') return asset.unit ? '$/' + asset.unit : '$';
  return asset.unit ? unitLabel() + '/' + asset.unit : unitLabel();
}

function catClass(asset){
  return asset && asset.cat ? 'cat-' + asset.cat : '';
}

function assetIconHTML(asset){
  if(window.Icons && window.Icons.assetSVG) return window.Icons.assetSVG(asset);
  return window.Icons ? window.Icons.get('barChart') : '';
}

function getChangeInfo(asset){
  const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
  const price = live && live.price != null ? live.price : null;
  const cp = live && live.changePercent != null ? live.changePercent : null;
  const hasChange = cp != null && price != null;

  let cls = 'neutral';
  let text = '—';
  if(hasChange){
    const up = cp >= 0;
    cls = up ? 'up' : 'down';
    text = (up ? '▲ ' : '▼ ') + Math.abs(cp).toFixed(2) + '٪';
  } else if(price == null){
    text = 'بدون داده';
  }

  return { price, cp, cls, text, hasChange };
}

function isFav(id){
  return window.Storage && window.Storage.fav
    ? window.Storage.fav.get().includes(id)
    : false;
}

/* ═══════════════════════════════════════════════════════════
   کارت نماد
═══════════════════════════════════════════════════════════ */
function assetHTML(asset){
  if(!asset) return '';

  const info = getChangeInfo(asset);
  const fav = isFav(asset.id);
  const iconHTML = assetIconHTML(asset);
  const isEmpty = info.price == null;
  const priceText = info.price != null ? formatPrice(asset, info.price) : '—';
  const unitText = priceUnitLabel(asset);

  const upDownCls = info.cls === 'up' ? 'is-up' : (info.cls === 'down' ? 'is-down' : '');

  return `
    <article class="asset-card ${upDownCls} ${isEmpty ? 'is-empty' : ''}"
             data-card-id="${esc(asset.id)}"
             data-card-kind="asset"
             role="button"
             tabindex="${isEmpty ? '-1' : '0'}"
             aria-label="${esc(asset.name)}">
      <header class="asset-card-head">
        <div class="asset-card-icon ${catClass(asset)}">
          ${iconHTML}
        </div>
        <div class="asset-card-title">
          <span class="asset-card-name">${esc(asset.short || asset.name)}</span>
          <span class="asset-card-code">${esc(asset.code)}</span>
        </div>
        <button type="button"
                class="asset-card-fav ${fav ? 'is-fav' : ''}"
                data-fav-toggle="${esc(asset.id)}"
                aria-label="${fav ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}">
          ${window.Icons ? window.Icons.get(fav ? 'starFilled' : 'star') : ''}
        </button>
      </header>

      <div class="asset-card-body">
        <span class="asset-card-change ${info.cls}">${info.text}</span>
        <div class="asset-card-price">
          <span class="asset-card-price-value">${priceText}</span>
          ${unitText ? `<span class="asset-card-price-unit">${esc(unitText)}</span>` : ''}
        </div>
      </div>

      ${!isEmpty ? `
        <div class="asset-card-spark">
          <canvas data-spark-canvas="${esc(asset.id)}"></canvas>
        </div>
      ` : ''}
    </article>
  `;
}

/* ═══════════════════════════════════════════════════════════
   کارت Live Strip
═══════════════════════════════════════════════════════════ */
function liveStripHTML(asset){
  if(!asset) return '';

  const info = getChangeInfo(asset);
  const iconHTML = assetIconHTML(asset);
  const isEmpty = info.price == null;
  const priceText = info.price != null ? formatPrice(asset, info.price) : '—';
  const upDownCls = info.cls === 'up' ? 'is-up' : (info.cls === 'down' ? 'is-down' : '');

  return `
    <div class="live-strip-card ${upDownCls} ${isEmpty ? 'is-empty' : ''}"
         data-card-id="${esc(asset.id)}"
         data-card-kind="asset"
         role="button"
         tabindex="${isEmpty ? '-1' : '0'}">
      <div class="live-strip-head">
        <div class="live-strip-icon ${catClass(asset)}">${iconHTML}</div>
        <div class="live-strip-info">
          <strong>${esc(asset.short || asset.name)}</strong>
          <small>${esc(asset.code)}</small>
        </div>
      </div>
      <div class="live-strip-price">${priceText}</div>
      <span class="live-strip-change ${info.cls}">${info.text}</span>
      ${!isEmpty ? `
        <div class="live-strip-spark">
          <canvas data-spark-canvas="${esc(asset.id)}"></canvas>
        </div>
      ` : ''}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   کارت خودرو
═══════════════════════════════════════════════════════════ */
const CAR_IMAGE_MAP = {
  'وانت-آریسان': 'وانت-آریسان.jpg',
  'سورن-TU5P': 'سورن-(TU5P).jpg',
  'سورن-XU7P-رینگ-فولادی': 'سورن-XU7P-(رینگ-فولادی).jpg',
  'سورن-XU7P': 'سورن-(TU5P).jpg',
  'سورن-پلاس-دوگانه-سوز-کپسول-کوچک': 'سورن-پلاس-دوگانه-سوز-(کپسول-کوچک).jpg',
  'سورن-پلاس-دوگانه-سوز-کپسول-بزرگ': 'سورن-پلاس-دوگانه-سوز-(کپسول-بزرگ).jpg',
  'دنا-پلاس-اتوماتیک': 'دنا-پلاس-اتوماتیک.jpg',
  'پژو-207-موتور-TU3': 'پژو-207-موتور-TU3.jpg',
  'پژو-207-دنده-ای-هیدرولیک': 'پژو-207-دنده-ای-(هیدرولیک).jpg',
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
  'شاهین-اتوماتیک-G': 'شاهین-اتوماتیک-G.jpg',
  'شاهین-دنده-پلاس': 'شاهین-دنده-پلاس.webp',
  'شاهین-اتوماتیک-پلاس': 'شاهین-اتوماتیک-پلاس.jpg',
  'سایپا-151-GX': 'سایپا-151-GX.jpg',
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

function carImage(car){
  if(!car || !car.id) return 'assets/cars/x-car.webp';
  const img = CAR_IMAGE_MAP[car.id];
  return img ? 'assets/cars/' + img : 'assets/cars/x-car.webp';
}

function carHTML(car){
  if(!car) return '';

  const imgSrc = carImage(car);
  const priceMarket = car.priceMarket;
  const priceFactory = car.priceFactory;
  const changePercent = car.changePercent != null ? car.changePercent : 0;
  const up = changePercent >= 0;
  const hasChange = changePercent !== 0;

  const statusMap = {
    'available':    { label: 'موجود',      cls: 'success' },
    'unavailable':  { label: 'ناموجود',    cls: 'muted' },
    'coming-soon':  { label: 'به زودی',    cls: 'info' },
    'discontinued': { label: 'توقف تولید', cls: 'danger' },
    'not-selling':  { label: 'توقف فروش',  cls: 'danger' }
  };
  const status = statusMap[car.status] || { label: '', cls: '' };

  const fmt = (v) => v != null ? formatPrice({ ptype: 'rial', dec: 0 }, v) : '—';
  const isPlaceholder = priceMarket == null && priceFactory == null;

  return `
    <article class="car-card"
             data-car-id="${esc(car.id || '')}"
             data-card-kind="car"
             role="button"
             tabindex="0"
             aria-label="${esc(car.name)}">
      <div class="car-card-image">
        <img src="${imgSrc}"
             alt="${esc(car.name)}"
             loading="lazy"
             onerror="this.onerror=null;this.src='assets/cars/x-car.webp'">
        <img class="car-card-watermark"
             src="assets/logo.webp"
             alt=""
             aria-hidden="true">
        ${status.label ? `<span class="car-card-status ${status.cls}">${status.label}</span>` : ''}
      </div>

      <div class="car-card-body">
        <h3 class="car-card-name">${esc(car.name || '—')}</h3>
        <span class="car-card-category">${esc(car.category || '')}</span>

        ${!isPlaceholder ? `
          <div class="car-card-prices">
            ${priceFactory != null ? `
              <div class="car-price-row">
                <span class="car-price-label">کارخانه</span>
                <strong class="car-price-value factory">${fmt(priceFactory)}</strong>
              </div>
            ` : ''}
            ${priceMarket != null ? `
              <div class="car-price-row">
                <span class="car-price-label">بازار</span>
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

/* ═══════════════════════════════════════════════════════════
   Sparkline — رسم روی کارت‌ها
═══════════════════════════════════════════════════════════ */
const _sparkCache = new Map();

async function drawSparkline(canvas, asset){
  try {
    const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
    const cp = live ? live.changePercent : null;
    const isUp = (cp || 0) >= 0;

    const cacheKey = 'spark_' + asset.id + '_' + getUnit();
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

    const color = isUp ? '#10b981' : '#ef4444';
    const fillStart = isUp ? 'rgba(16,185,129,.28)' : 'rgba(239,68,68,.28)';

    const w = r.width;
    const h = r.height;
    const pad = 2;

    const pts = prices.map((p, i) => ({
      x: pad + (i / (prices.length - 1)) * (w - pad * 2),
      y: h - pad - ((p - min) / range) * (h - pad * 2)
    }));

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fillStart);
    g.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

  } catch(e){ /* بی‌صدا */ }
}

let _sparkObserver = null;

function initSparkObserver(){
  if(_sparkObserver) return;
  _sparkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const canvas = entry.target;
        const id = canvas.dataset.sparkCanvas;
        const asset = window.DATA && window.DATA.find(id);
        if(asset) drawSparkline(canvas, asset).catch(() => {});
        _sparkObserver.unobserve(canvas);
      }
    });
  }, { rootMargin: '120px', threshold: 0.01 });
}

function drawAllSparklines(root){
  if(!root) return;
  const canvases = root.querySelectorAll('[data-spark-canvas]');
  if(!canvases.length) return;

  requestAnimationFrame(() => {
    canvases.forEach(canvas => {
      const id = canvas.dataset.sparkCanvas;
      const asset = window.DATA && window.DATA.find(id);
      if(!asset) return;

      const rect = canvas.getBoundingClientRect();
      if(rect.width > 0 && rect.height > 0){
        drawSparkline(canvas, asset).catch(() => {});
      } else {
        if(!_sparkObserver) initSparkObserver();
        _sparkObserver.observe(canvas);
      }
    });
  });
}

function clearSparkCache(){
  _sparkCache.clear();
}

/* ═══════════════════════════════════════════════════════════
   Context Menu (منوی شیشه‌ای)
═══════════════════════════════════════════════════════════ */
function buildMenu(){
  if(_menuEl) return;

  _backdropEl = document.createElement('div');
  _backdropEl.className = 'ctx-backdrop';
  document.body.appendChild(_backdropEl);

  _menuEl = document.createElement('div');
  _menuEl.className = 'ctx-menu';
  _menuEl.setAttribute('role', 'menu');
  document.body.appendChild(_menuEl);

  _toastEl = document.createElement('div');
  _toastEl.className = 'ctx-toast';
  document.body.appendChild(_toastEl);

  _backdropEl.addEventListener('click', closeMenu);
}

function openMenu(e, asset, kind){
  buildMenu();

  _currentAsset = asset;
  _currentCar = kind === 'car' ? asset : null;

  const iconHTML = kind === 'car'
    ? (window.Icons ? window.Icons.get('car') : '')
    : assetIconHTML(asset);

  const name = kind === 'car'
    ? (asset.name || '—')
    : (asset.short || asset.name);

  const code = kind === 'car'
    ? (asset.category || '')
    : (asset.code || '');

  const priceText = kind === 'car'
    ? (asset.priceMarket != null ? formatPrice({ptype:'rial'}, asset.priceMarket)
      : asset.priceFactory != null ? formatPrice({ptype:'rial'}, asset.priceFactory)
      : '—')
    : (() => {
        const live = window.API.getById(asset.id);
        return live && live.price != null ? formatPrice(asset, live.price) : '—';
      })();

  const changeInfo = kind === 'car'
    ? (() => {
        const cp = asset.changePercent || 0;
        const cls = cp > 0 ? 'up' : cp < 0 ? 'down' : 'neutral';
        const text = cp === 0 ? 'بدون تغییر' : (cp > 0 ? '▲ ' : '▼ ') + Math.abs(cp).toFixed(2) + '٪';
        return { cls, text };
      })()
    : getChangeInfo(asset);

  const isFavNow = kind !== 'car' && isFav(asset.id);

  _menuEl.innerHTML = `
    <div class="ctx-menu-head">
      <div class="ctx-head-icon ${kind !== 'car' ? catClass(asset) : ''}">${iconHTML}</div>
      <div class="ctx-head-info">
        <strong>${esc(name)}</strong>
        <small>${esc(code)}</small>
      </div>
    </div>
    <div class="ctx-menu-list">
      <button type="button" class="ctx-item" data-ctx="copy-price">
        <span class="ctx-item-icon">${window.Icons.get('file')}</span>
        <span class="ctx-item-label">کپی قیمت</span>
        <span class="ctx-item-hint">${esc(priceText)}</span>
      </button>
      <button type="button" class="ctx-item" data-ctx="copy-name">
        <span class="ctx-item-icon">${window.Icons.get('note')}</span>
        <span class="ctx-item-label">کپی نام</span>
      </button>
      <button type="button" class="ctx-item" data-ctx="share">
        <span class="ctx-item-icon">${window.Icons.get('external')}</span>
        <span class="ctx-item-label">اشتراک‌گذاری</span>
      </button>
      ${kind !== 'car' ? `
        <button type="button" class="ctx-item" data-ctx="fav">
          <span class="ctx-item-icon">${window.Icons.get(isFavNow ? 'starFilled' : 'star')}</span>
          <span class="ctx-item-label">${isFavNow ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}</span>
        </button>
        <button type="button" class="ctx-item" data-ctx="chart">
          <span class="ctx-item-icon">${window.Icons.get('activity')}</span>
          <span class="ctx-item-label">مشاهده نمودار</span>
        </button>
      ` : ''}
      <div class="ctx-divider"></div>
      <button type="button" class="ctx-item" data-ctx="close">
        <span class="ctx-item-icon">${window.Icons.get('close')}</span>
        <span class="ctx-item-label">بستن</span>
      </button>
    </div>
  `;

  positionMenu(e);

  _menuEl.querySelectorAll('[data-ctx]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleMenuAction(btn.dataset.ctx);
    });
  });

  requestAnimationFrame(() => {
    _menuEl.classList.add('is-open');
    _backdropEl.classList.add('is-open');
  });
}

function positionMenu(e){
  const menu = _menuEl;
  const rect = menu.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x, y;

  if(e && (e.clientX || e.touches)){
    x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  } else if(e && e.target){
    const tr = e.target.closest('[data-card-id]')?.getBoundingClientRect();
    if(tr){
      x = tr.left + tr.width / 2;
      y = tr.top + tr.height / 2;
    } else {
      x = vw / 2;
      y = vh / 2;
    }
  } else {
    x = vw / 2;
    y = vh / 2;
  }

  const w = rect.width || 240;
  const h = rect.height || 300;
  const pad = 12;

  let left = x - w / 2;
  let top = y - h / 2;

  if(left < pad) left = pad;
  if(left + w > vw - pad) left = vw - w - pad;
  if(top < pad) top = pad;
  if(top + h > vh - pad) top = vh - h - pad;

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}

function closeMenu(){
  if(_menuEl) _menuEl.classList.remove('is-open');
  if(_backdropEl) _backdropEl.classList.remove('is-open');
  _currentAsset = null;
  _currentCar = null;
}

function handleMenuAction(action){
  const asset = _currentAsset;
  const car = _currentCar;
  if(!asset) return;

  if(action === 'close'){ closeMenu(); return; }

  if(action === 'copy-price'){
    const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
    let text = '';
    if(car){
      text = car.priceMarket != null
        ? formatPrice({ptype:'rial'}, car.priceMarket) + ' تومان'
        : car.priceFactory != null
          ? formatPrice({ptype:'rial'}, car.priceFactory) + ' تومان'
          : '—';
    } else {
      text = live && live.price != null
        ? formatPrice(asset, live.price) + ' ' + (priceUnitLabel(asset) || '')
        : '—';
    }
    copyText(text.trim());
    closeMenu();
    return;
  }

  if(action === 'copy-name'){
    const text = car ? car.name : (asset.name || asset.short);
    copyText(text);
    closeMenu();
    return;
  }

  if(action === 'share'){
    closeMenu();
    if(window.Share){
      setTimeout(() => {
        if(car) window.Share.openCar(car);
        else window.Share.open(asset);
      }, 80);
    }
    return;
  }

  if(action === 'fav'){
    if(window.Storage && window.Storage.fav){
      window.Storage.fav.toggle(asset.id);
      showToast(
        isFav(asset.id) ? 'به علاقه‌مندی اضافه شد' : 'از علاقه‌مندی حذف شد',
        'success'
      );
      if(window.UI && window.UI.refreshAll){
        setTimeout(() => window.UI.refreshAll(), 60);
      }
    }
    closeMenu();
    return;
  }

  if(action === 'chart'){
    closeMenu();
    if(window.UI && window.UI.go){
      window.UI.go('chart');
      setTimeout(() => {
        if(window.API){
          const evt = new CustomEvent('cards:chart', { detail: { id: asset.id } });
          window.dispatchEvent(evt);
        }
      }, 60);
    }
    return;
  }
}

/* ═══════════════════════════════════════════════════════════
   Copy to clipboard
═══════════════════════════════════════════════════════════ */
function copyText(text){
  if(!text){ showToast('چیزی برای کپی نیست', 'error'); return; }

  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text)
      .then(() => showToast('کپی شد ✓', 'success'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text){
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(ok ? 'کپی شد ✓' : 'کپی نشد', ok ? 'success' : 'error');
  } catch(e){
    showToast('کپی نشد', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   Toast
═══════════════════════════════════════════════════════════ */
let _toastTimer = null;
function showToast(msg, type){
  if(!_toastEl){
    _toastEl = document.createElement('div');
    _toastEl.className = 'ctx-toast';
    document.body.appendChild(_toastEl);
  }
  _toastEl.textContent = msg;
  _toastEl.className = 'ctx-toast ' + (type || '');
  requestAnimationFrame(() => _toastEl.classList.add('is-show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => _toastEl.classList.remove('is-show'), 2000);
}

/* ═══════════════════════════════════════════════════════════
   Long-press / Right-click
═══════════════════════════════════════════════════════════ */
function findCardEl(target){
  return target.closest('[data-card-id], [data-car-id]');
}

function getCardData(el){
  if(!el) return null;
  if(el.dataset.carId){
    const cars = window.API && window.API.getCars ? window.API.getCars() : null;
    if(cars && cars.cars){
      const car = cars.cars.find(c => c.id === el.dataset.carId);
      if(car) return { kind: 'car', data: car };
    }
    return null;
  }
  if(el.dataset.cardId){
    const asset = window.DATA && window.DATA.find ? window.DATA.find(el.dataset.cardId) : null;
    if(asset) return { kind: 'asset', data: asset };
  }
  return null;
}

function startPress(el, e){
  if(_longPressTimer) clearTimeout(_longPressTimer);
  _pressingEl = el;
  el.classList.add('is-pressing');

  _longPressTimer = setTimeout(() => {
    const info = getCardData(el);
    if(info){
      el.classList.remove('is-pressing');
      if(navigator.vibrate) navigator.vibrate(15);
      openMenu(e, info.data, info.kind);
    }
  }, LONG_PRESS_MS);
}

function cancelPress(){
  if(_longPressTimer){
    clearTimeout(_longPressTimer);
    _longPressTimer = null;
  }
  if(_pressingEl){
    _pressingEl.classList.remove('is-pressing');
    _pressingEl = null;
  }
}

function attachLongPress(root){
  if(!root) root = document;

  /* ─── Touch ─── */
  root.addEventListener('touchstart', (e) => {
    if(e.touches.length !== 1) return;
    const el = findCardEl(e.target);
    if(!el) return;
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
    _touchStartT = Date.now();
    startPress(el, e);
  }, { passive: true });

  root.addEventListener('touchmove', (e) => {
    if(!_pressingEl) return;
    if(e.touches.length !== 1){ cancelPress(); return; }
    const dx = Math.abs(e.touches[0].clientX - _touchStartX);
    const dy = Math.abs(e.touches[0].clientY - _touchStartY);
    if(dx > TOUCH_MOVE_TOLERANCE || dy > TOUCH_MOVE_TOLERANCE) cancelPress();
  }, { passive: true });

  root.addEventListener('touchend', () => {
    cancelPress();
  }, { passive: true });

  root.addEventListener('touchcancel', cancelPress, { passive: true });

  /* ─── Mouse ─── */
  root.addEventListener('mousedown', (e) => {
    if(e.button !== 0) return;
    if(e.target.closest('button, a, input, select, textarea')) return;
    const el = findCardEl(e.target);
    if(!el) return;
    startPress(el, e);
  });

  root.addEventListener('mouseup', cancelPress);
  root.addEventListener('mouseleave', cancelPress);

  /* ─── Right-click (contextmenu) ─── */
  root.addEventListener('contextmenu', (e) => {
    const el = findCardEl(e.target);
    if(!el) return;
    e.preventDefault();
    cancelPress();
    const info = getCardData(el);
    if(info){
      openMenu(e, info.data, info.kind);
    }
  });

  /* ─── Scroll = cancel ─── */
  window.addEventListener('scroll', cancelPress, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════════ */
return {
  assetHTML,
  carHTML,
  liveStripHTML,
  drawSparkline,
  drawAllSparklines,
  clearSparkCache,
  attachLongPress,
  openMenu,
  closeMenu,
  showToast,
  copyText,
  formatNumber,
  formatPrice,
  priceUnitLabel
};

})();
/**
 * قیمتو 6.0 — UI (کامل)
 * ✅ کارت بانکی پرتفوی
 * ✅ جدول خودروها
 * ✅ نمودار + Tooltip
 * ✅ جستجوی همه‌کاره
 * ✅ تمام ابزارها
 */

window.UI = (function(){
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ============================================================
   STATE
============================================================ */
let filter = 'all';
let search = '';
let currentPage = 'home';
let activeChartId = 'gold18';

let carsData = null;
let carsFilter = 'all';
let carsSearch = '';
let carsLoading = false;

const PAGES = ['home', 'markets', 'chart', 'compare', 'favorites', 'cars', 'settings'];

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
  goldCrypto: 'gold'
};

function assetIcon(asset){
  if(!asset) return '';
  if(window.Icons && window.Icons.assetSVG) return window.Icons.assetSVG(asset);
  return window.Icons ? window.Icons.get('barChart') : '';
}

function catColor(asset){
  return CAT_COLOR[asset.cat] || 'gold';
}

/* ============================================================
   UNIT SYSTEM
============================================================ */
function getUnit(){
  return window.CFG.get('currency') || 'toman';
}

function userToBase(value){
  if(value == null || isNaN(value)) return null;
  const unit = getUnit();
  return unit === 'toman' ? value * 10 : value;
}

function baseToUser(value){
  if(value == null || isNaN(value)) return null;
  const unit = getUnit();
  return unit === 'toman' ? value / 10 : value;
}

function unitLabel(){
  return getUnit() === 'toman' ? 'تومان' : 'ریال';
}

function fullUnitLabel(asset){
  if(!asset) return '';
  const unit = asset.unit || '';
  if(asset.ptype === 'usd'){
    return unit ? '$/' + unit : '$';
  }
  const money = unitLabel();
  return unit ? money + '/' + unit : money;
}

function formatPrice(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';

  if(asset && asset.ptype === 'usd'){
    const dec = asset.dec != null ? asset.dec : 2;
    return '$' + window.U.num(rialValue, dec);
  }

  const val = baseToUser(rialValue);
  const abs = Math.abs(val);
  const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
  return window.U.num(val, d) + ' ' + unitLabel();
}

function formatPriceWithUnit(asset, rialValue){
  if(rialValue == null) return '—';
  const price = formatPrice(asset, rialValue);
  const unit = asset && asset.unit ? ' / ' + asset.unit : '';
  return price + unit;
}

/* ============================================================
   MARKET CARD
============================================================ */
function marketCardHTML(asset){
  const live = API.getById(asset.id);
  const price = live && live.price != null ? live.price : null;
  const cp = live ? live.changePercent : null;
  const up = (cp || 0) >= 0;
  const color = catColor(asset);
  const isFav = Storage.fav.get().includes(asset.id);
  const noPrice = price == null;

  return `
    <article class="m-card ${noPrice ? 'm-card-empty' : ''}" data-card-id="${asset.id}" role="button" tabindex="0">
      <div class="m-card-head">
        <div class="m-card-icon ${color}">${assetIcon(asset)}</div>
        <div class="m-card-info">
          <strong>${U.esc(asset.short || asset.name)}</strong>
          <small>${asset.code}</small>
        </div>
        <button type="button" class="icon-btn" data-fav-toggle="${asset.id}"
          style="width:24px;height:24px;color:${isFav?'var(--warn)':'var(--dim)'};font-size:14px;flex-shrink:0;padding:0;background:none;border:0">
          ${Icons.get('star')}
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
    </article>
  `;
}

/* ============================================================
   HOME RENDERS
============================================================ */
function renderFeatured(){
  const c = $('[data-featured]');
  if(!c) return;
  const list = window.DATA.FEATURED.map(id => window.DATA.find(id)).filter(Boolean);
  c.innerHTML = list.map(marketCardHTML).join('');
}

function renderMostUsed(){
  const c = $('[data-most]');
  if(!c) return;
  const list = window.DATA.MOST_USED.map(id => window.DATA.find(id)).filter(Boolean);
  c.innerHTML = list.map(marketCardHTML).join('');
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
    { id:'volume-conv', name:'مبدل حجم',        icon:'swap' },
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
    <button type="button" class="tool-chip" data-tool="${t.id}">
      <span class="tool-chip-icon">${window.Icons.get(t.icon)}</span>
      <span class="tool-chip-name">${t.name}</span>
    </button>
  `).join('');
}

/* ============================================================
   BANK CARD
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

  let displayValue = '0 تومان';
  let displayChange = '';
  if(!isEmpty){
    const unitText = unitLabel();
    const val = baseToUser(totalNow);
    displayValue = window.U.num(val, 0) + ' ' + unitText;
    displayChange = `
      <span class="bank-card-change">
        ${up ? '▲' : '▼'} ${up ? '+' : ''}${plPct.toFixed(2)}%
      </span>
    `;
  }

  wrap.innerHTML = `
    <div class="bank-card ${isEmpty ? 'is-empty' : ''}" data-tool="portfolio">
      <div class="bank-card-top">
        <div class="bank-card-brand">
          <img src="assets/logo.png" alt="قیمتو">
          <div class="bank-card-brand-text">
            <strong>قیمتو</strong>
            <small>${isEmpty ? 'پرتفوی خالی' : window.U.num(list.length) + ' دارایی'}</small>
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
        <button type="button" class="bank-card-add" data-tool="portfolio" aria-label="افزودن">
          ${window.Icons.get('plus')}
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   MARKETS
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
  if(cnt) cnt.textContent = list.length + ' نماد';

  g.innerHTML = list.map(marketCardHTML).join('');
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

  if(cnt) cnt.textContent = list.length + ' مورد';
  if(empty) empty.hidden = list.length > 0;

  g.innerHTML = list.map(marketCardHTML).join('');
}

/* ============================================================
   HEADER TICKER
============================================================ */
function renderHdrTicker(){
  const track = $('[data-hdr-ticker-track]');
  if(!track) return;

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

  track.innerHTML = items + items;
}

/* ============================================================
   CARS TABLE
============================================================ */
async function loadCarsData(force){
  if(carsLoading) return;
  carsLoading = true;

  if(!force){
    const cached = window.Storage.carsCache.get();
    if(cached && (Date.now() - cached.t) < 10 * 60 * 1000){
      carsData = cached.d;
      carsLoading = false;
      return;
    }
  }

  try {
    const res = await fetch('data/cars.json?_=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    carsData = json;
    window.Storage.carsCache.save(json);
  } catch(err){
    console.warn('[Cars]', err.message);
    const cached = window.Storage.carsCache.get();
    if(cached) carsData = cached.d;
  } finally {
    carsLoading = false;
  }
}

function renderCarsTable(el, limit, showMore){
  if(!el) return;

  if(!carsData || !carsData.cars || !carsData.cars.length){
    el.innerHTML = '<div class="empty"><h3>در حال بارگذاری...</h3></div>';
    return;
  }

  let cars = carsData.cars.slice();

  if(carsFilter !== 'all'){
    if(carsFilter === 'discontinued'){
      cars = cars.filter(c => c.status === 'discontinued' || c.status === 'not-selling');
    } else {
      cars = cars.filter(c => c.status === carsFilter);
    }
  }

  if(carsSearch){
    const q = carsSearch.toLowerCase().trim();
    cars = cars.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  }

  if(!cars.length){
    el.innerHTML = '';
    return;
  }

  const total = cars.length;
  const display = limit > 0 ? cars.slice(0, limit) : cars;

  el.innerHTML = display.map(carRowHTML).join('') +
    (showMore && total > limit && limit > 0
      ? '<div class="cars-more" data-cars-more>نمایش همه ' + window.U.num(total) + ' خودرو</div>'
      : '');
}

function carRowHTML(car){
  const statusClass = car.status === 'unavailable' ? 'is-unavailable'
    : car.status === 'discontinued' || car.status === 'not-selling' ? 'is-discontinued'
    : car.status === 'coming-soon' ? 'is-coming'
    : 'is-available';

  let priceHtml;
  if(car.priceMarket != null){
    priceHtml = '<span>' + window.U.num(Math.round(car.priceMarket / 10)) + '</span><span class="unit">تومان</span>';
  } else if(car.priceFactory != null){
    priceHtml = '<span>' + window.U.num(Math.round(car.priceFactory / 10)) + '</span><span class="unit">تومان</span>';
  } else {
    priceHtml = '<span class="is-placeholder">' + window.U.esc(car.rawPriceMarket || car.rawPriceFactory || 'نامشخص') + '</span>';
  }

  let changeHtml = '';
  if(car.changePercent != null && car.changePercent !== 0){
    const up = car.changePercent >= 0;
    changeHtml = '<span class="car-row-change ' + (up ? 'up' : 'down') + '">' +
      (up ? '▲' : '▼') + ' ' + window.U.num(Math.abs(car.changePercent), 2) + '%</span>';
  }

  return '<div class="car-row ' + statusClass + '">' +
    '<div class="car-row-name">' + window.U.esc(car.name) + '</div>' +
    '<div class="car-row-price">' + priceHtml + changeHtml + '</div>' +
  '</div>';
}

function renderHomeCars(){
  const el = document.querySelector('[data-home-cars]');
  if(!el) return;

  if(!carsData){
    loadCarsData(false).then(() => {
      renderCarsTable(el, 10, true);
    });
    return;
  }

  renderCarsTable(el, 10, true);
}

function renderCarsPage(){
  const el = document.querySelector('[data-cars-list]');
  const emptyEl = document.querySelector('[data-cars-empty]');
  const updatedEl = document.querySelector('[data-cars-updated]');
  if(!el) return;

  if(!carsData){
    el.innerHTML = '<div class="empty"><h3>در حال بارگذاری...</h3></div>';
    loadCarsData(false).then(() => renderCarsPage());
    return;
  }

  renderCarsTable(el, 0, false);

  if(!el.innerHTML.trim() && emptyEl){
    emptyEl.hidden = false;
  } else if(emptyEl){
    emptyEl.hidden = true;
  }

  if(updatedEl && carsData.updatedTehran){
    updatedEl.textContent = 'آخرین بروزرسانی: ' + carsData.updatedTehran;
  }
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
  if(canvas) drawChartAsync(canvas, asset);

  await renderChartQuestions(asset, live);
  renderBubbleAnalysis(asset, live);

  const relEl = $('[data-c-related]');
  if(relEl){
    const related = window.DATA.byCat(asset.cat)
      .filter(a => a.id !== asset.id)
      .slice(0, 10);
    relEl.innerHTML = related.map(marketCardHTML).join('');
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
  try {
    if(window.API.getHistory){
      history = await window.API.getHistory(asset, 30);
    }
  } catch(e){
    console.warn('[Questions] history failed:', e.message);
  }

  const sortedHistory = (history || []).slice().sort((a, b) => a.t - b.t);

  function findPriceAt(msAgo){
    if(!sortedHistory.length) return null;
    const target = Date.now() - msAgo;
    let closest = null, minDiff = Infinity;
    for(const p of sortedHistory){
      const diff = Math.abs(p.t - target);
      if(diff < minDiff){ minDiff = diff; closest = p; }
    }
    if(closest && minDiff < 3 * 24 * 60 * 60 * 1000){
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
      ? '<span class="chart-q-answer ' + cls + '">' + (change >= 0 ? '▲' : '▼') + ' ' + Math.abs(change).toFixed(2) + '%</span>'
      : '<span class="chart-q-answer neutral">—</span>';

    return '<div class="chart-q-item"><div class="chart-q-body">' +
      '<span class="chart-q-question">' + label + '</span>' + changeText +
    '</div></div>';
  }

  function valueItem(label, value){
    return '<div class="chart-q-item"><div class="chart-q-body">' +
      '<span class="chart-q-question">' + label + '</span>' +
      '<span class="chart-q-answer neutral">' + (value || '—') + '</span>' +
    '</div></div>';
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
    ? '$' + window.U.num(current, asset.dec || 2) + u
    : window.U.num(baseToUser(current), 0) + ' ' + unitLabel() + u;

  questions.push(valueItem('در حال حاضر قیمت ' + asset.name + ' چقدر می‌باشد؟', currentDisplay));

  questions.push(changeItem('قیمت ' + asset.name + ' نسبت به دیروز چقدر تغییر کرده است؟',
    priceDayAgo ? pctChange(priceDayAgo, current) : changePct));

  if(priceHourAgo){
    questions.push(changeItem('قیمت ' + asset.name + ' نسبت به یک ساعت قبل چقدر تغییر کرده است؟',
      pctChange(priceHourAgo, current)));
  }

  if(open != null){
    questions.push(valueItem('نرخ بازگشایی ' + asset.name + ' در روز جاری چقدر بوده است؟',
      formatPrice(asset, open) + u));
  }

  if(low != null){
    questions.push(valueItem('پایین‌ترین قیمت امروز ' + asset.name + ' چقدر بوده است؟',
      formatPrice(asset, low) + u));
  }

  if(high != null){
    questions.push(valueItem('بالاترین قیمت امروز ' + asset.name + ' چقدر بوده است؟',
      formatPrice(asset, high) + u));
  }

  if(priceWeekAgo){
    questions.push(changeItem('قیمت ' + asset.name + ' نسبت به یک هفته گذشته چقدر تغییر کرده است؟',
      pctChange(priceWeekAgo, current)));
  }

  if(priceMonthAgo){
    questions.push(changeItem('قیمت ' + asset.name + ' نسبت به یک ماه گذشته چقدر تغییر کرده است؟',
      pctChange(priceMonthAgo, current)));
  }

  if(price6MonthAgo){
    questions.push(changeItem('قیمت ' + asset.name + ' نسبت به ۶ ماه گذشته چقدر تغییر کرده است؟',
      pctChange(price6MonthAgo, current)));
  }

  if(sortedHistory.length > 0){
    let highest = { p: 0, t: 0 };
    for(const p of sortedHistory){
      if(p.p > highest.p){ highest = p; }
    }
    if(highest.p > 0){
      const dateStr = new Date(highest.t).toLocaleDateString('fa-IR');
      questions.push('<div class="chart-q-item"><div class="chart-q-body">' +
        '<span class="chart-q-question">بالاترین قیمت ' + asset.name + ' تاکنون چقدر بوده است؟</span>' +
        '<span class="chart-q-answer neutral">' + formatPrice(asset, highest.p) + u + '</span>' +
        '<span class="chart-q-date-tiny">' + dateStr + '</span>' +
      '</div></div>');
    }
  }

  if(priceDayAgo){
    questions.push(changeItem('سود روزانه سرمایه‌گذاری در ' + asset.name + ' چقدر برآورد می‌شود؟',
      pctChange(priceDayAgo, current)));
  }

  if(priceWeekAgo){
    questions.push(changeItem('سود یک هفته سرمایه‌گذاری در ' + asset.name + ' چقدر بوده است؟',
      pctChange(priceWeekAgo, current)));
  }

  if(priceMonthAgo){
    questions.push(changeItem('سود یک ماهه خرید ' + asset.name + ' چقدر بوده است؟',
      pctChange(priceMonthAgo, current)));
  }

  if(price3MonthAgo){
    questions.push(changeItem('سود سه ماهه سرمایه‌گذاری در ' + asset.name + ' چقدر برآورد می‌شود؟',
      pctChange(price3MonthAgo, current)));
  }

  if(priceYearAgo){
    questions.push(changeItem('سود سالانه سرمایه‌گذاری در ' + asset.name + ' چقدر بوده است؟',
      pctChange(priceYearAgo, current)));
  }

  listEl.innerHTML = questions.join('');
}

/* ============================================================
   BUBBLE ANALYSIS
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

  body.innerHTML =
    '<div class="bubble-row"><span>انس جهانی طلا</span><strong>$' + window.U.num(ounceUSD, 2) + '</strong></div>' +
    '<div class="bubble-row"><span>نرخ دلار</span><strong>' + formatPrice({ptype:'rial'}, dollarRial) + '</strong></div>' +
    '<div class="bubble-row"><span>قیمت جهانی گرم ' + karat + ' عیار</span><strong>' + formatPrice({ptype:'rial'}, gramWorldKarat) + '</strong></div>' +
    '<div class="bubble-row"><span>قیمت ' + (isCoin ? 'سکه' : 'گرم') + ' در ایران</span><strong>' + formatPrice({ptype:'rial'}, iranValue) + '</strong></div>' +
    '<div class="bubble-row bubble-total"><span>' + bubbleLabel + '</span><strong class="' + bubbleClass + '">' +
      (bubble >= 0 ? '+' : '') + formatPrice({ptype:'rial'}, Math.abs(bubble)) +
    '</strong></div>';
}

/* ============================================================
   CHART DRAW
============================================================ */
async function drawChartAsync(canvas, asset){
  try {
    let chartData = null;

    if(window.API.getHistory){
      try {
        const history = await window.API.getHistory(asset, 30);
        if(history && history.length >= 2){
          chartData = history.map(h => ({
            t: h.t,
            p: h.p,
            gd: h.gd || '',
            pd: h.pd || ''
          }));
        }
      } catch(e){}
    }

    if(!chartData || chartData.length < 2){
      const prices = window.API.history(asset, 60, window.CFG.get('chartPeriod') || '1D');
      chartData = prices.map((p, i) => ({
        t: Date.now() - (prices.length - i) * 86400000,
        p: p,
        gd: '',
        pd: ''
      }));
    }

    if(!chartData || chartData.length < 2) return;

    const first = chartData[0].p;
    const last = chartData[chartData.length - 1].p;
    const up = last >= first;
    const color = up ? '#10b981' : '#ef4444';

    window.Charts.drawLine(canvas, chartData, {
      padding: 20,
      paddingTop: 30,
      lineWidth: 2.5,
      color: color,
      formatter: v => formatPrice(asset, v)
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
  if(c) window.Charts.drawCompare(c, window.API.history(A, 60, '1D'), window.API.history(B, 60, '1D'));

  const st = $('[data-cmp-stats]');
  if(st){
    const lA = window.API.getById(A.id);
    const lB = window.API.getById(B.id);
    st.innerHTML =
      '<div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">' +
        '<small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">' + window.U.esc(A.name) + '</small>' +
        '<strong style="display:block;font-size:16px;font-weight:800;direction:ltr">' + (lA ? formatPrice(A, lA.price) : '—') + '</strong>' +
      '</div>' +
      '<div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">' +
        '<small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">' + window.U.esc(B.name) + '</small>' +
        '<strong style="display:block;font-size:16px;font-weight:800;direction:ltr">' + (lB ? formatPrice(B, lB.price) : '—') + '</strong>' +
      '</div>';
  }

  sA.onchange = renderCompare;
  sB.onchange = renderCompare;
}

function renderHomeChart(){
  const c = $('[data-home-chart]');
  if(!c) return;
  const asset = window.DATA.find('gold18');
  if(!asset) return;
  drawChartAsync(c, asset);
}

/* ============================================================
   ROUTER
============================================================ */
function go(page){
  if(!PAGES.includes(page)) page = 'home';
  currentPage = page;

  $$('.page').forEach(p => p.classList.toggle('is-active', p.dataset.page === page));
  $$('[data-route]').forEach(b => b.classList.toggle('is-active', b.dataset.route === page));

  try { history.replaceState(null, '', '#' + page); } catch(e){}

  document.body.classList.remove('sidebar-open');

  if(page === 'home'){
    renderBankCard();
    renderFeatured();
    renderMostUsed();
    renderCats();
    renderTools();
    renderHomeCars();
    renderHomeChart();
  }
  if(page === 'markets') renderMarkets();
  if(page === 'chart') renderChartPage();
  if(page === 'compare') renderCompare();
  if(page === 'favorites') renderFavs();
  if(page === 'cars') renderCarsPage();

  renderHdrTicker();
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

function toast(msg, type = ''){
  const t = $('[data-toast]');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast is-show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('is-show'), 2400);
}

/* ============================================================
   TOOLS — ساده
============================================================ */
function money(v){ return formatPrice({ptype:'rial'}, v); }

function toolGold(){ toast('محاسبه‌گر طلا در حال توسعه'); }
function toolCoin(){ toast('محاسبه‌گر سکه در حال توسعه'); }
function toolOunce(){ toast('محاسبه‌گر انس در حال توسعه'); }
function toolSilver(){ toast('محاسبه‌گر نقره در حال توسعه'); }
function toolConv(){ toast('مبدل ارز در حال توسعه'); }
function toolCryptoConv(){ toast('مبدل کریپتو در حال توسعه'); }
function toolUnitConv(){ toast('مبدل واحد در حال توسعه'); }
function toolVolumeConv(){ toast('مبدل حجم در حال توسعه'); }
function toolPortfolio(){ toast('پرتفوی در حال توسعه'); }
function toolAlerts(){ toast('هشدار قیمت در حال توسعه'); }
function toolNotes(){ toast('یادداشت‌ها در حال توسعه'); }
function toolProfit(){ toast('محاسبه سود در حال توسعه'); }
function toolZakat(){ toast('محاسبه زکات در حال توسعه'); }
function toolAvgBuy(){ toast('میانگین خرید در حال توسعه'); }

function openTool(tool){
  if(tool === 'tv'){
    if(window.TV){
      if(TV.isActive()) TV.close();
      else TV.open();
    } else {
      toast('حالت TV در دسترس نیست', 'warning');
    }
    return;
  }
  if(tool === 'fullscreen'){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    return;
  }
  if(tool === 'gold') return toolGold();
  if(tool === 'coin') return toolCoin();
  if(tool === 'ounce') return toolOunce();
  if(tool === 'silver') return toolSilver();
  if(tool === 'conv') return toolConv();
  if(tool === 'crypto-conv') return toolCryptoConv();
  if(tool === 'unit-conv') return toolUnitConv();
  if(tool === 'volume-conv') return toolVolumeConv();
  if(tool === 'portfolio') return toolPortfolio();
  if(tool === 'alerts') return toolAlerts();
  if(tool === 'notes') return toolNotes();
  if(tool === 'profit') return toolProfit();
  if(tool === 'zakat') return toolZakat();
  if(tool === 'avg') return toolAvgBuy();
  if(tool === 'export'){
    const btn = document.querySelector('[data-action="export"]');
    if(btn) btn.click();
  }
}

/* ============================================================
   SEARCH
============================================================ */
let searchResults = [];

function doSearch(query){
  const res = $('[data-search-results]');
  if(!res) return;

  const q = (query || '').trim().toLowerCase();

  if(!q || q.length < 2){
    res.hidden = true;
    res.innerHTML = '';
    searchResults = [];
    return;
  }

  const results = [];

  window.DATA.ASSETS.forEach(a => {
    if(a.name.toLowerCase().includes(q) ||
       a.code.toLowerCase().includes(q) ||
       a.id.toLowerCase().includes(q)){
      results.push({
        type: 'asset',
        id: a.id,
        name: a.name,
        code: a.code,
        icon: assetIcon(a),
        cat: window.DATA.CATEGORIES[a.cat] ? window.DATA.CATEGORIES[a.cat].label : ''
      });
    }
  });

  if(carsData && carsData.cars){
    carsData.cars.forEach(c => {
      if(c.name.toLowerCase().includes(q) ||
         (c.category && c.category.toLowerCase().includes(q))){
        results.push({
          type: 'car',
          id: c.id,
          name: c.name,
          code: c.category || 'خودرو',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 17h14M5 17a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 17v2m14-2v2M7 13l1.5-4.5A1 1 0 0 1 9.4 8h5.2a1 1 0 0 1 .9.6L17 13"/></svg>',
          cat: 'خودرو',
          price: c.priceMarket
        });
      }
    });
  }

  const limited = results.slice(0, 15);
  searchResults = limited;

  if(!limited.length){
    res.innerHTML = '<div class="ms-empty">نتیجه‌ای یافت نشد</div>';
    res.hidden = false;
    return;
  }

  res.innerHTML = limited.map((r, i) => {
    let price = '';
    if(r.type === 'asset'){
      const live = window.API.getById(r.id);
      price = live && live.price != null ? formatPrice(window.DATA.find(r.id), live.price) : '—';
    } else if(r.type === 'car' && r.price != null){
      price = window.U.num(Math.round(r.price / 10)) + ' تومان';
    }

    return '<div class="ms-item ' + (i === 0 ? 'is-active' : '') + '" data-idx="' + i + '">' +
      '<div class="ms-item-icon">' + r.icon + '</div>' +
      '<div class="ms-item-info">' +
        '<strong>' + window.U.esc(r.name) + '</strong>' +
        '<small>' + r.code + ' · ' + r.cat + '</small>' +
      '</div>' +
      '<div class="ms-item-price">' + price + '</div>' +
    '</div>';
  }).join('');
  res.hidden = false;

  res.querySelectorAll('.ms-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const item = searchResults[+el.dataset.idx];
      if(item.type === 'asset'){
        activeChartId = item.id;
        closeSearch();
        go('chart');
      } else if(item.type === 'car'){
        closeSearch();
        go('cars');
        setTimeout(() => {
          const inp = $('[data-cars-search]');
          if(inp) inp.value = item.name;
          carsSearch = item.name;
          renderCarsPage();
        }, 200);
      }
    });
  });
}

function closeSearch(){
  const res = $('[data-search-results]');
  if(res){
    res.hidden = true;
    res.innerHTML = '';
  }
  const input = $('[data-search-input]');
  if(input) input.value = '';
  searchResults = [];
}

/* ============================================================
   EVENT HANDLING
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
    window.API.fetchData(true).then(() => {
      toast('بروزرسانی شد ✓', 'success');
    }).catch(() => {
      toast('خطا در بروزرسانی', 'error');
    }).finally(() => {
      refreshBtn.dataset.loading = '';
    });
    return;
  }

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
    else if(currentPage === 'home'){ renderFeatured(); renderMostUsed(); }
    else if(currentPage === 'chart'){ renderChartPage(); }
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

  const chip = e.target.closest('[data-filters] [data-filter]');
  if(chip){
    e.preventDefault();
    e.stopPropagation();
    $$('[data-filters] .chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    filter = chip.dataset.filter;
    renderMarkets();
    return;
  }

  const carsChip = e.target.closest('[data-cars-filter]');
  if(carsChip){
    e.preventDefault();
    e.stopPropagation();
    $$('[data-cars-filter]').forEach(c => c.classList.remove('is-active'));
    carsChip.classList.add('is-active');
    carsFilter = carsChip.dataset.carsFilter;
    if(currentPage === 'cars') renderCarsPage();
    else if(currentPage === 'home') renderHomeCars();
    return;
  }

  const more = e.target.closest('[data-cars-more]');
  if(more){
    e.preventDefault();
    e.stopPropagation();
    const el = document.querySelector('[data-home-cars]');
    if(el) renderCarsTable(el, 0, false);
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
    } else if(k){
      window.CFG.set(k, sw.classList.contains('is-on'));
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
    if(currentPage === 'chart') renderChartPage();
    if(currentPage === 'home') renderHomeChart();
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
   REFRESH ALL
============================================================ */
function refreshAll(){
  if(currentPage === 'home'){
    renderBankCard();
    renderFeatured();
    renderMostUsed();
    renderCats();
    renderTools();
    renderHomeCars();
    renderHomeChart();
  }
  if(currentPage === 'markets') renderMarkets();
  if(currentPage === 'chart') renderChartPage();
  if(currentPage === 'compare') renderCompare();
  if(currentPage === 'favorites') renderFavs();
  if(currentPage === 'cars') renderCarsPage();
  renderHdrTicker();
  if(window.TV && window.TV.isActive()) window.TV.refresh();
}

/* ============================================================
   INIT
============================================================ */
function init(){
  window.CFG.load();
  document.body.classList.toggle('dark', window.CFG.get('theme') === 'dark');

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

  const si = $('[data-search-input]');
  if(si){
    si.addEventListener('input', window.U.debounce(e => doSearch(e.target.value), 150));
  }

  const carsSearchInp = $('[data-cars-search]');
  if(carsSearchInp){
    carsSearchInp.addEventListener('input', window.U.debounce(e => {
      carsSearch = e.target.value.trim();
      if(currentPage === 'cars') renderCarsPage();
    }, 200));
  }

  const iv = $('[data-input="interval"]');
  if(iv){
    iv.value = window.CFG.get('refreshInterval');
    iv.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      window.CFG.set('refreshInterval', v);
      window.API.start(v);
      toast('فاصله: ' + (v / 1000) + 's', 'success');
    });
  }

  window.addEventListener('online', () => {
    toast('اتصال برقرار شد ✓', 'success');
    window.API.fetchData(true).catch(() => {});
  });

  window.addEventListener('offline', () => {
    toast('حالت آفلاین', 'warning');
  });

  window.API.subscribe(() => {
    refreshAll();
  });

  renderHdrTicker();

  loadCarsData(false).then(() => {
    if(currentPage === 'home') renderHomeCars();
    if(currentPage === 'cars') renderCarsPage();
  });
}

/* ============================================================
   PUBLIC API
============================================================ */
return {
  init: init,
  go: go,
  toast: toast,
  refreshAll: refreshAll,
  openModal: openModal,
  closeModal: closeModal,
  closeSearch: closeSearch,
  renderChartPage: renderChartPage,
  renderMarkets: renderMarkets,
  renderFavs: renderFavs,
  renderBankCard: renderBankCard,
  renderFeatured: renderFeatured,
  renderMostUsed: renderMostUsed,
  renderTools: renderTools,
  renderCats: renderCats,
  renderHdrTicker: renderHdrTicker,
  renderCarsTable: renderCarsTable,
  renderCarsPage: renderCarsPage,
  renderHomeCars: renderHomeCars,
  loadCarsData: loadCarsData,
  getUserName: getUserName,
  saveUserName: saveUserName,
  formatPrice: formatPrice,
  formatPriceWithUnit: formatPriceWithUnit,
  fullUnitLabel: fullUnitLabel,
  baseToUser: baseToUser,
  userToBase: userToBase,
  openTool: openTool,
  toolGold: toolGold,
  toolCoin: toolCoin,
  toolOunce: toolOunce,
  toolSilver: toolSilver,
  toolConv: toolConv,
  toolCryptoConv: toolCryptoConv,
  toolUnitConv: toolUnitConv,
  toolVolumeConv: toolVolumeConv,
  toolPortfolio: toolPortfolio,
  toolAlerts: toolAlerts,
  toolNotes: toolNotes,
  toolProfit: toolProfit,
  toolZakat: toolZakat,
  toolAvgBuy: toolAvgBuy
};

})();
/**
 * قیمتو 5.7 — UI
 * ✅ کارت بانکی پرتفوی
 * ✅ ۲۰ سوال TGJU در Chart
 * ✅ تحلیل حباب طلا
 * ✅ سیستم واحد هوشمند (تومان/ریال)
 * ✅ جستجوی inline
 * ✅ تومان/ریال هماهنگ با محاسبات
 */
window.UI = (function(){
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let filter = 'all';
let search = '';
let currentPage = 'home';
let activeChartId = 'gold18';

const PAGES = ['home', 'markets', 'chart', 'compare', 'favorites', 'settings'];

/* ============================================================
   ICON HELPERS
============================================================ */
const CAT_COLOR = {
  gold: 'gold', currency: 'blue', metal: 'purple',
  energy: 'orange', crypto: 'orange', commodity: 'green',
  index: 'cyan', goldCrypto: 'gold', ratio: 'purple'
};

function assetIcon(asset){
  if(!asset) return '';
  if(window.Icons && window.Icons.assetSVG) return window.Icons.assetSVG(asset);
  return window.Icons ? window.Icons.get('barChart') : '';
}

function catColor(asset){ return CAT_COLOR[asset.cat] || 'gold'; }

/* ============================================================
   UNIT SYSTEM — همه چیز بر اساس واحد کاربر
============================================================ */
function getUnit(){
  return window.CFG.get('currency') || 'toman';
}

/**
 * تبدیل ورودی کاربر به واحد پایه (ریال)
 * چون API داده رو ریال می‌ده
 */
function userToBase(value){
  if(value == null || isNaN(value)) return null;
  const unit = getUnit();
  return unit === 'toman' ? value * 10 : value;
}

/**
 * تبدیل داده پایه (ریال) به واحد کاربر
 */
function baseToUser(value){
  if(value == null || isNaN(value)) return null;
  const unit = getUnit();
  return unit === 'toman' ? value / 10 : value;
}

/**
 * نمایش قیمت با واحد
 */
function formatPrice(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';
  
  const unit = getUnit();
  const unitText = unit === 'toman' ? 'تومان' : 'ریال';
  
  // برای نمادهای USD — دلار نمایش بده
  if(asset && asset.ptype === 'usd'){
    return '$' + window.U.num(rialValue, asset.dec || 2);
  }
  
  const val = baseToUser(rialValue);
  const abs = Math.abs(val);
  const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
  return window.U.num(val, d) + ' ' + unitText;
}

/**
 * نمایش عدد خالص بدون واحد (برای محاسبات)
 */
function formatNumber(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';
  if(asset && asset.ptype === 'usd') return window.U.num(rialValue, asset.dec || 2);
  return window.U.num(baseToUser(rialValue), 0);
}

/* ============================================================
   CARD HTML
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
   BANK CARD — کارت بانکی پرتفوی
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
  const isFav = (window.Storage.fav.get() || []).length;

  let totalBuy = 0, totalNow = 0;
  const isEmpty = !list.length;

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

  // حرف اول اسم کاربر برای آواتار
  const firstChar = userName.trim().charAt(0) || '👤';

  // مقدار نمایشی
  let displayValue = '0 تومان';
  let displayChange = '';
  if(!isEmpty){
    const unit = getUnit();
    const unitText = unit === 'toman' ? 'تومان' : 'ریال';
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
          <img src="assets/logo.svg" alt="قیمتو">
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
    'gold24', 'coin_bahar', 'gbp', 'aed', 'crypto-solana'
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
   CHART PAGE — با ۲۰ سوال TGJU + تحلیل حباب
============================================================ */
async function renderChartPage(){
  const asset = window.DATA.find(activeChartId);
  if(!asset) return;

  const live = window.API.getById(asset.id);

  // ۱. هدر
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

  // ۲. قیمت اصلی
  const priceEl = $('[data-c-price]');
  if(priceEl){
    priceEl.textContent = live && live.price != null ? formatPrice(asset, live.price) : '—';
  }

  // ۳. تغییرات
  const changeEl = $('[data-c-change]');
  if(changeEl && live && live.changePercent != null){
    const up = live.changePercent >= 0;
    changeEl.textContent = (up ? '▲' : '▼') + ' ' + Math.abs(live.changePercent).toFixed(2) + '%';
    changeEl.className = 'chart-change ' + (up ? 'up' : 'down');
  } else if(changeEl){
    changeEl.textContent = '—';
    changeEl.className = 'chart-change';
  }

  // ۴. واحد + زمان
  const unitEl = $('[data-c-unit]');
  if(unitEl){
    const unitText = getUnit() === 'toman' ? 'تومان' : 'ریال';
    unitEl.textContent = asset.ptype === 'usd' ? 'دلار' : unitText;
  }

  const timeEl = $('[data-c-time]');
  if(timeEl) timeEl.textContent = live && live.time ? live.time : '—';

  // ۵. نمودار
  const canvas = $('[data-chart-canvas]');
  if(canvas) drawChartAsync(canvas, asset);

  // ۶. ۲۰ سوال TGJU
  await renderChartQuestions(asset, live);

  // ۷. تحلیل حباب (فقط برای طلا/سکه)
  renderBubbleAnalysis(asset, live);

  // ۸. نمادهای مرتبط
  const relEl = $('[data-c-related]');
  if(relEl){
    const related = window.DATA.byCat(asset.cat)
      .filter(a => a.id !== asset.id)
      .slice(0, 10);
    relEl.innerHTML = related.map(marketCardHTML).join('');
  }
}

/* ============================================================
   ۲۰ سوال TGJU
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
    listEl.innerHTML = '<div class="chart-q-item"><div class="chart-q-body"><span class="chart-q-answer">داده‌ای موجود نیست</span></div></div>';
    return;
  }

  const current = live.price;
  const high = live.high;
  const low = live.low;
  const open = live.open;
  const changePct = live.changePercent || 0;

  // تاریخچه برای محاسبه
  let history = [];
  try {
    if(window.API.getHistory){
      history = await window.API.getHistory(asset, 365); // ۱ سال
    }
  } catch(e){}

  const sortedHistory = (history || []).slice().sort((a,b) => a.t - b.t);

  function findPriceAt(msAgo){
    if(!sortedHistory.length) return null;
    const target = Date.now() - msAgo;
    let closest = null, minDiff = Infinity;
    for(const p of sortedHistory){
      const diff = Math.abs(p.t - target);
      if(diff < minDiff){ minDiff = diff; closest = p; }
    }
    if(closest && minDiff < 3 * 24 * 60 * 60 * 1000){ // حداکثر ۳ روز اختلاف
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

  function pctChange(from, to){
    if(from == null || to == null || from === 0) return null;
    return ((to - from) / from) * 100;
  }

  function changeItem(label, value, change, upGood){
    const hasValue = value != null;
    const hasChange = change != null;
    
    let cls = 'neutral';
    if(hasChange){
      const isUp = change >= 0;
      cls = isUp ? 'up' : 'down';
    }

    const changeText = hasChange 
      ? `<span class="chart-q-answer ${cls}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%</span>`
      : `<span class="chart-q-answer neutral">—</span>`;

    return `
      <div class="chart-q-item">
        <div class="chart-q-num">${upGood || ''}</div>
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
        <div class="chart-q-num">•</div>
        <div class="chart-q-body">
          <span class="chart-q-question">${label}</span>
          <span class="chart-q-answer neutral">${value || '—'}</span>
        </div>
      </div>
    `;
  }

  const priceToday = current;
  const priceDayAgo = findPriceAt(dayAgo);
  const priceHourAgo = findPriceAt(hourAgo);
  const priceWeekAgo = findPriceAt(weekAgo);
  const priceMonthAgo = findPriceAt(monthAgo);
  const price6MonthAgo = findPriceAt(sixMonthAgo);
  const priceYearAgo = findPriceAt(yearAgo);

  const questions = [];

  // ۱. قیمت فعلی (تومان یا ریال بر اساس واحد کاربر)
  const unitText = getUnit() === 'toman' ? 'تومان' : 'ریال';
  const currentDisplay = asset.ptype === 'usd' 
    ? '$' + window.U.num(current, asset.dec || 2)
    : window.U.num(baseToUser(current), 0) + ' ' + unitText;

  questions.push(valueItem(
    `در حال حاضر قیمت ${asset.name} چقدر می‌باشد؟`,
    currentDisplay
  ));

  // ۲. تغییر نسبت به دیروز
  if(priceDayAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به دیروز چقدر تغییر کرده است؟`,
      priceDayAgo,
      pctChange(priceDayAgo, current)
    ));
  }

  // ۳. نرخ بازگشایی امروز
  if(open != null){
    questions.push(changeItem(
      `نرخ بازگشایی ${asset.name} در روز جاری چقدر بوده است؟`,
      open,
      pctChange(open, current)
    ));
  }

  // ۴. پایین‌ترین قیمت امروز
  if(low != null){
    questions.push(valueItem(
      `پایین‌ترین قیمتی که در بازار امروز برای ${asset.name} به ثبت رسیده چقدر بوده است؟`,
      formatPrice(asset, low)
    ));
  }

  // ۵. بالاترین قیمت امروز
  if(high != null){
    questions.push(valueItem(
      `بالاترین قیمتی که در بازار امروز برای ${asset.name} به ثبت رسیده چقدر بوده است؟`,
      formatPrice(asset, high)
    ));
  }

  // ۶. تغییر نسبت به ماه گذشته
  if(priceMonthAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به ماه گذشته چقدر تغییر کرده است؟`,
      priceMonthAgo,
      pctChange(priceMonthAgo, current)
    ));
  }

  // ۷. تغییر نسبت به ۶ ماه گذشته
  if(price6MonthAgo){
    questions.push(changeItem(
      `قیمت ${asset.name} نسبت به ۶ ماه گذشته چقدر تغییر کرده است؟`,
      price6MonthAgo,
      pctChange(price6MonthAgo, current)
    ));
  }

  // ۸. بالاترین قیمت تاکنون
  if(sortedHistory.length > 0){
    let highest = { p: 0, t: 0 };
    for(const p of sortedHistory){
      if(p.p > highest.p){ highest = p; }
    }
    if(highest.p > 0){
      const dateStr = new Date(highest.t).toLocaleDateString('fa-IR');
      questions.push(`
        <div class="chart-q-item">
          <div class="chart-q-num">•</div>
          <div class="chart-q-body">
            <span class="chart-q-question">بالاترین قیمت ${asset.name} تاکنون چقدر و در چه تاریخی بوده است؟</span>
            <span class="chart-q-answer neutral">${formatPrice(asset, highest.p)}</span>
            <span class="chart-q-date-tiny">📅 ${dateStr}</span>
          </div>
        </div>
      `);
    }
  }

  // ۹. سود یک ماهه
  if(priceMonthAgo){
    const profit = pctChange(priceMonthAgo, current);
    questions.push(changeItem(
      `سود یک ماهه خرید ${asset.name} چقدر بوده است؟`,
      priceMonthAgo,
      profit
    ));
  }

  // ۱۰. سود ۶ ماهه
  if(price6MonthAgo){
    const profit = pctChange(price6MonthAgo, current);
    questions.push(changeItem(
      `سود شش ماهه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      price6MonthAgo,
      profit
    ));
  }

  // ۱۱. سود سه ماهه
  const threeMonthAgo = findPriceAt(90 * dayAgo);
  if(threeMonthAgo){
    questions.push(changeItem(
      `سود سه ماهه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      threeMonthAgo,
      pctChange(threeMonthAgo, current)
    ));
  }

  // ۱۲. سود سالانه
  if(priceYearAgo){
    questions.push(changeItem(
      `سود سالانه سرمایه‌گذاری در ${asset.name} چقدر بوده است؟`,
      priceYearAgo,
      pctChange(priceYearAgo, current)
    ));
  }

  // ۱۳. سود روزانه
  if(priceDayAgo){
    questions.push(changeItem(
      `سود روزانه سرمایه‌گذاری در ${asset.name} چقدر برآورد می‌شود؟`,
      priceDayAgo,
      pctChange(priceDayAgo, current)
    ));
  }

  // ۱۴. مقایسه با سکه
  const coinMonthAgo = getHistoryPriceFor('coin', monthAgo, history.length ? 30 : 0);
  if(coinMonthAgo && priceMonthAgo){
    const thisProfit = pctChange(priceMonthAgo, current);
    const coinProfit = coinMonthAgo.change;
    questions.push(`
      <div class="chart-q-item">
        <div class="chart-q-num">⚖</div>
        <div class="chart-q-body">
          <span class="chart-q-question">آیا در یک ماه اخیر، سرمایه‌گذاری در ${asset.name} نسبت به سکه سودمندتر بوده یا خیر؟</span>
          <span class="chart-q-answer ${thisProfit >= coinProfit ? 'up' : 'down'}">
            ${thisProfit >= coinProfit ? '✅ بله' : '❌ خیر'} (شما: ${thisProfit.toFixed(2)}% / سکه: ${coinProfit.toFixed(2)}%)
          </span>
        </div>
      </div>
    `);
  }

  // ۱۵. مقایسه با دلار
  const dollarMonthAgo = getHistoryPriceFor('dollar', monthAgo, history.length ? 30 : 0);
  if(dollarMonthAgo && priceMonthAgo){
    const thisProfit = pctChange(priceMonthAgo, current);
    const dollarProfit = dollarMonthAgo.change;
    questions.push(`
      <div class="chart-q-item">
        <div class="chart-q-num">⚖</div>
        <div class="chart-q-body">
          <span class="chart-q-question">آیا در یک ماه اخیر، سرمایه‌گذاری در ${asset.name} نسبت به دلار سودمندتر بوده یا خیر؟</span>
          <span class="chart-q-answer ${thisProfit >= dollarProfit ? 'up' : 'down'}">
            ${thisProfit >= dollarProfit ? '✅ بله' : '❌ خیر'} (شما: ${thisProfit.toFixed(2)}% / دلار: ${dollarProfit.toFixed(2)}%)
          </span>
        </div>
      </div>
    `);
  }

  // ۱۶. مقایسه با بیت‌کوین
  const btcMonthAgo = getHistoryPriceFor('btc', monthAgo, history.length ? 30 : 0);
  if(btcMonthAgo && priceMonthAgo){
    const thisProfit = pctChange(priceMonthAgo, current);
    const btcProfit = btcMonthAgo.change;
    questions.push(`
      <div class="chart-q-item">
        <div class="chart-q-num">⚖</div>
        <div class="chart-q-body">
          <span class="chart-q-question">آیا در یک ماه اخیر، سرمایه‌گذاری در ${asset.name} نسبت به بیت‌کوین سودمندتر بوده یا خیر؟</span>
          <span class="chart-q-answer ${thisProfit >= btcProfit ? 'up' : 'down'}">
            ${thisProfit >= btcProfit ? '✅ بله' : '❌ خیر'} (شما: ${thisProfit.toFixed(2)}% / BTC: ${btcProfit.toFixed(2)}%)
          </span>
        </div>
      </div>
    `);
  }

  listEl.innerHTML = questions.join('');
}

/**
 * تاریخچه نماد دیگه رو می‌گیره و درصد تغییر یک ماهه برمی‌گردونه
 */
async function getHistoryPriceFor(assetId, msAgo, days){
  try {
    const a = window.DATA.find(assetId);
    if(!a) return null;
    const hist = await window.API.getHistory(a, Math.ceil(days) || 30);
    if(!hist || hist.length < 2) return null;
    const sorted = hist.slice().sort((x,y) => x.t - y.t);
    const target = Date.now() - msAgo;
    let closest = null, minDiff = Infinity;
    for(const p of sorted){
      const diff = Math.abs(p.t - target);
      if(diff < minDiff){ minDiff = diff; closest = p; }
    }
    if(closest && closest.p){
      const last = sorted[sorted.length - 1].p;
      const change = ((last - closest.p) / closest.p) * 100;
      return { past: closest.p, current: last, change };
    }
    return null;
  } catch(e){
    return null;
  }
}

/* ============================================================
   تحلیل حباب طلا
============================================================ */
function renderBubbleAnalysis(asset, live){
  const wrap = $('[data-bubble-analysis]');
  const body = $('[data-bubble-body]');
  if(!wrap || !body) return;

  // فقط برای طلا و سکه
  const isGold = asset.cat === 'gold' && (asset.tgju === 'geram18' || asset.tgju === 'geram24' || asset.tgju === 'gold_17');
  const isCoin = asset.id === 'coin' || asset.id === 'coin_bahar';
  
  if(!isGold && !isCoin){
    wrap.hidden = true;
    return;
  }

  if(!live || live.price == null){
    wrap.hidden = true;
    return;
  }

  // دریافت داده‌های انس و دلار
  const ounce = window.API.getById('ounce');
  const dollar = window.API.getById('dollar');

  if(!ounce || !dollar || ounce.price == null || dollar.price == null){
    wrap.hidden = true;
    return;
  }

  const ounceUSD = ounce.price;              // انس به دلار
  const dollarRial = dollar.price;            // دلار به ریال
  const goldIran = live.price;                // قیمت ایران به ریال

  // عیار
  let karat = 18;
  if(asset.tgju === 'geram24') karat = 24;
  else if(asset.tgju === 'gold_17') karat = 17;
  else if(asset.id === 'coin' || asset.id === 'coin_bahar') karat = 24; // سکه ۲۴ عیار

  // قیمت جهانی گرم طلا (به ریال)
  // 1 اونس = 31.1035 گرم
  const gramWorldRial = (ounceUSD / 31.1035) * dollarRial;
  
  // تبدیل به عیار مورد نظر
  const gramWorldKarat = gramWorldRial * (karat / 24);

  // برای سکه، وزن ۸.۱۳۳ گرم
  let worldValue, iranValue;
  if(isCoin){
    worldValue = gramWorldKarat * 8.133;
    iranValue = goldIran;
  } else {
    worldValue = gramWorldKarat;
    iranValue = goldIran;
  }

  // حباب
  const bubble = iranValue - worldValue;
  const bubblePct = (bubble / worldValue) * 100;

  const bubbleClass = bubblePct > 2 ? 'bubble-positive' : (bubblePct < -2 ? 'bubble-negative' : 'bubble-neutral');
  const bubbleLabel = bubblePct > 2 ? 'حباب مثبت' : (bubblePct < -2 ? 'حباب منفی' : 'متعادل');

  wrap.hidden = false;

  body.innerHTML = `
    <div class="bubble-row">
      <span>انس جهانی طلا</span>
      <strong>$${window.U.num(ounceUSD, 2)}</strong>
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
      <span>قیمت ${isCoin ? 'ایران (سکه)' : 'ایران (گرم)'}</span>
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
   رسم نمودار
============================================================ */
async function drawChartAsync(canvas, asset){
  try {
    let prices = null;

    if(window.API.getHistoryPrices){
      prices = await window.API.getHistoryPrices(asset, 7);
    }

    if(!prices || prices.length < 2){
      prices = window.API.history(asset, 60, window.CFG.get('chartPeriod') || '1D');
    }

    const first = prices[0];
    const last = prices[prices.length - 1];
    const up = last >= first;
    const color = up ? '#10b981' : '#ef4444';

    window.Charts.drawLine(canvas, prices, {
      padding: 20,
      lineWidth: 2.5,
      color: color
    });
  } catch(e){
    console.warn('[Chart] Failed:', e.message);
    const data = window.API.history(asset, 60, '1D');
    window.Charts.drawLine(canvas, data, { padding: 20, lineWidth: 2.5 });
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
    st.innerHTML = `
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">${window.U.esc(A.name)}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr">${lA ? formatPrice(A, lA.price) : '—'}</strong>
      </div>
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">تغییر ${A.code}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr;color:${(lA?.changePercent || 0) >= 0 ? 'var(--up)' : 'var(--down)'}">
          ${(lA?.changePercent || 0) >= 0 ? '+' : ''}${(lA?.changePercent || 0).toFixed(2)}%
        </strong>
      </div>
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">${window.U.esc(B.name)}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr">${lB ? formatPrice(B, lB.price) : '—'}</strong>
      </div>
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">تغییر ${B.code}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr;color:${(lB?.changePercent || 0) >= 0 ? 'var(--up)' : 'var(--down)'}">
          ${(lB?.changePercent || 0) >= 0 ? '+' : ''}${(lB?.changePercent || 0).toFixed(2)}%
        </strong>
      </div>
    `;
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
    renderHomeChart();
  }
  if(page === 'markets') renderMarkets();
  if(page === 'chart') renderChartPage();
  if(page === 'compare') renderCompare();
  if(page === 'favorites') renderFavs();

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
   TOOLS — ابزارها با واحد هوشمند
============================================================ */
function unitLabel(){ return getUnit() === 'toman' ? 'تومان' : 'ریال'; }

function money(v){ return formatPrice({ptype:'rial'}, v); }

function toolGold(){
  const gold = window.API.getById('gold18');
  if(!gold || gold.price == null){ toast('در حال دریافت قیمت...', 'warning'); return; }

  openModal(`<span data-icon="calculator"></span> محاسبه‌گر طلا`, `
    <div class="form-grid">
      <div class="form-group">
        <label>وزن (گرم)</label>
        <input class="input" type="number" value="10" step="0.01" data-gw>
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-gk>
          <option value="18" selected>۱۸</option>
          <option value="24">۲۴</option>
          <option value="22">۲۲</option>
          <option value="21">۲۱</option>
          <option value="14">۱۴</option>
        </select>
      </div>
      <div class="form-group">
        <label>اجرت ساخت (%)</label>
        <input class="input" type="number" value="7" step="0.1" data-gwg>
      </div>
      <div class="form-group">
        <label>سود فروشنده (%)</label>
        <input class="input" type="number" value="5" step="0.1" data-gp>
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label>مالیات (%)</label>
        <input class="input" type="number" value="9" step="0.1" data-gt>
      </div>
    </div>
    <div class="result-box" data-gold-out></div>
  `);

  function calc(){
    const w = parseFloat($('[data-gw]')?.value) || 0;
    const k = parseFloat($('[data-gk]')?.value) || 18;
    const wg = parseFloat($('[data-gwg]')?.value) || 0;
    const pr = parseFloat($('[data-gp]')?.value) || 0;
    const tx = parseFloat($('[data-gt]')?.value) || 0;

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
      <select class="select" data-ct>
        ${sel.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>تعداد</label>
      <input class="input" type="number" value="1" min="1" data-cc>
    </div>
    <div class="result-box" data-coin-out></div>
  `);

  function calc(){
    const id = $('[data-ct]')?.value;
    const n = parseInt($('[data-cc]')?.value) || 1;
    const live = window.API.getById(id);
    const out = $('[data-coin-out]');
    if(!live || live.price == null){
      if(out) out.innerHTML = '<div class="result-row"><span>در حال دریافت...</span></div>';
      return;
    }
    const tot = live.price * n;
    if(out) out.innerHTML = `
      <div class="result-row"><span>قیمت واحد</span><strong>${money(live.price)}</strong></div>
      <div class="result-row"><span>تعداد</span><strong>${window.U.num(n)} عدد</strong></div>
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
        <input class="input" type="number" value="1" step="0.01" data-oc>
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-ok>
          <option value="24">۲۴ عیار</option>
          <option value="18" selected>۱۸ عیار</option>
          <option value="21">۲۱ عیار</option>
        </select>
      </div>
    </div>
    <div class="result-box" data-ounce-out></div>
  `);

  function calc(){
    const n = parseFloat($('[data-oc]')?.value) || 1;
    const k = parseFloat($('[data-ok]')?.value) || 18;
    const dollar = window.API.getById('dollar');
    if(!dollar || dollar.price == null) return;

    const totalUSD = ounce.price * n;
    const totalRial = totalUSD * dollar.price;
    const gramPrice = totalRial / 31.1035;
    const gramK = gramPrice * (k / 24);

    const out = $('[data-ounce-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>ارزش دلاری</span><strong>$${window.U.num(totalUSD, 2)}</strong></div>
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
      <input class="input" type="number" value="100" step="0.01" data-sv>
    </div>
    <div class="result-box" data-silver-out></div>
  `);

  function calc(){
    const w = parseFloat($('[data-sv]')?.value) || 0;
    const dollar = window.API.getById('dollar');
    if(!dollar || dollar.price == null) return;
    const pricePerGram = (silver.price * dollar.price) / 31.1035;
    const total = w * pricePerGram;

    const out = $('[data-silver-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>هر گرم</span><strong>${money(pricePerGram)}</strong></div>
      <div class="result-row result-total"><span>ارزش ${w} گرم</span><strong>${money(total)}</strong></div>
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
      <input class="input" type="number" value="1000000" data-va>
    </div>
    <div style="display:grid;grid-template-columns:1fr 48px 1fr;gap:10px;align-items:center">
      <select class="select" data-vf>${opts}</select>
      <button type="button" class="btn btn-primary" data-vs style="padding:10px;width:48px;height:48px;border-radius:14px">⇄</button>
      <select class="select" data-vt>${opts}</select>
    </div>
    <div class="result-box" data-conv-out></div>
  `);

  const selF = $('[data-vf]');
  const selT = $('[data-vt]');
  if(selF) selF.value = 'dollar';
  if(selT) selT.value = 'euro';

  function calc(){
    const userAmt = parseFloat($('[data-va]')?.value) || 0;
    const amtBase = userToBase(userAmt); // به ریال
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
      <div class="result-row"><span>${window.U.num(userAmt, 2)} ${f.code}</span><strong>${window.U.num(res, 4)} ${t.code}</strong></div>
      <div class="result-row"><span>نرخ تبدیل</span><strong>۱ ${f.code} = ${window.U.num(lf.price / lt.price, 4)} ${t.code}</strong></div>
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
      <input class="input" type="number" value="1" step="0.0001" data-cca>
    </div>
    <div style="display:grid;grid-template-columns:1fr 48px 1fr;gap:10px;align-items:center">
      <select class="select" data-ccf>${opts}</select>
      <button type="button" class="btn btn-primary" data-ccs style="padding:10px;width:48px;height:48px;border-radius:14px">⇄</button>
      <select class="select" data-cct>${opts}</select>
    </div>
    <div class="result-box" data-crypto-out></div>
  `);

  const f = $('[data-ccf]');
  const t = $('[data-cct]');
  if(f) f.value = 'btc';
  if(t) t.value = 'usdt';

  function calc(){
    const amt = parseFloat($('[data-cca]')?.value) || 0;
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
      <div class="result-row"><span>${window.U.num(amt, 4)} ${from.code}</span><strong>${window.U.num(res, 6)} ${to.code}</strong></div>
      <div class="result-row"><span>ارزش دلاری</span><strong>$${window.U.num(usdVal, 2)}</strong></div>
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
  openModal(`<span data-icon="swap"></span> مبدل واحد`, `
    <div class="form-group">
      <label>مقدار</label>
      <input class="input" type="number" value="1" step="0.01" data-ua>
    </div>
    <div style="display:grid;grid-template-columns:1fr 48px 1fr;gap:10px;align-items:center">
      <select class="select" data-uf>
        <option value="gram">گرم</option>
        <option value="mesghal">مثقال</option>
        <option value="ounce">انس</option>
        <option value="kilo">کیلوگرم</option>
      </select>
      <button type="button" class="btn btn-primary" data-us style="padding:10px;width:48px;height:48px;border-radius:14px">⇄</button>
      <select class="select" data-ut>
        <option value="gram" selected>گرم</option>
        <option value="mesghal">مثقال</option>
        <option value="ounce">انس</option>
        <option value="kilo">کیلوگرم</option>
      </select>
    </div>
    <div class="result-box" data-unit-out></div>
  `);

  const toGram = { gram: 1, mesghal: 4.6083, ounce: 31.1035, kilo: 1000 };

  function calc(){
    const amt = parseFloat($('[data-ua]')?.value) || 0;
    const from = $('[data-uf]')?.value;
    const to = $('[data-ut]')?.value;
    if(!from || !to) return;

    const inGram = amt * toGram[from];
    const res = inGram / toGram[to];
    const labels = { gram:'گرم', mesghal:'مثقال', ounce:'انس', kilo:'کیلوگرم' };

    const out = $('[data-unit-out]');
    if(out) out.innerHTML = `
      <div class="result-row"><span>مقدار ورودی</span><strong>${window.U.num(amt, 4)} ${labels[from]}</strong></div>
      <div class="result-row result-total"><span>معادل</span><strong>${window.U.num(res, 4)} ${labels[to]}</strong></div>
    `;
  }
  $$('[data-ua],[data-uf],[data-ut]').forEach(el => {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  $('[data-us]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const a = $('[data-uf]').value;
    $('[data-uf]').value = $('[data-ut]').value;
    $('[data-ut]').value = a;
    calc();
  });
  calc();
}

function toolPortfolio(){
  openModal(`<span data-icon="briefcase"></span> پرتفوی من`, `
    <div class="form-group">
      <label>نماد</label>
      <select class="select" data-pa>
        ${window.DATA.ASSETS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>مقدار</label>
        <input class="input" type="number" placeholder="۱۰" data-pq>
      </div>
      <div class="form-group">
        <label>قیمت خرید (${unitLabel()})</label>
        <input class="input" type="number" placeholder="خودکار" data-pp>
      </div>
    </div>
    <button type="button" class="btn btn-primary btn-block" data-padd>
      <span data-icon="plus"></span>
      افزودن به پرتفوی
    </button>
    <div style="margin-top:16px" data-pf-list></div>
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
        <div class="result-row" style="padding:12px;border-radius:12px;background:var(--card-2);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="m-card-icon" style="width:32px;height:32px;border-radius:10px">
              ${assetIcon(a)}
            </div>
            <div>
              <strong style="display:block;font-size:13px">${window.U.esc(a.name)}</strong>
              <small style="font-size:11px;color:var(--muted)">${window.U.num(item.qty)} × ${formatPrice(a, item.buyPrice)}</small>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="text-align:end">
              <strong style="display:block;font-size:13px;direction:ltr">${formatPrice(a, nv)}</strong>
              <small style="color:${pl >= 0 ? 'var(--up)' : 'var(--down)'};font-weight:800;direction:ltr">
                ${pl >= 0 ? '+' : ''}${pct.toFixed(2)}%
              </small>
            </div>
            <button type="button" class="icon-btn" data-pf-del2="${item.ts}"
              style="width:28px;height:28px;font-size:14px;color:var(--muted)">
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
    const qty = parseFloat($('[data-pq]')?.value);
    const ppUser = parseFloat($('[data-pp]')?.value);
    if(!id || !qty || qty <= 0){ toast('مقدار را وارد کنید', 'error'); return; }
    
    let buyBase;
    if(ppUser && !isNaN(ppUser)){
      buyBase = userToBase(ppUser); // تبدیل ورودی کاربر به ریال
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
    const pq = $('[data-pq]');
    const ppEl = $('[data-pp]');
    if(pq) pq.value = '';
    if(ppEl) ppEl.value = '';
    toast('اضافه شد ✓', 'success');
  });

  render();
}

function toolAlerts(){
  openModal(`<span data-icon="bell"></span> هشدار قیمت`, `
    <div class="form-group">
      <label>نماد</label>
      <select class="select" data-al-a>
        ${window.DATA.ASSETS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>بالاتر از (${unitLabel()})</label>
        <input class="input" type="number" data-al-up>
      </div>
      <div class="form-group">
        <label>پایین‌تر از (${unitLabel()})</label>
        <input class="input" type="number" data-al-dn>
      </div>
    </div>
    <button type="button" class="btn btn-primary btn-block" data-al-save>
      <span data-icon="plus"></span>
      ذخیره هشدار
    </button>
    <div style="margin-top:16px" data-al-list></div>
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
      return `
        <div class="result-row" style="padding:10px;border-radius:10px;background:var(--card-2);margin-bottom:6px">
          <span>${window.U.esc(a?.name || '—')} — ${parts.join(' / ')}</span>
          <button type="button" class="icon-btn" data-al-del="${al.ts}"
            style="font-size:14px;width:28px;height:28px;color:var(--muted)">
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
    const upUser = parseFloat($('[data-al-up]')?.value) || null;
    const dnUser = parseFloat($('[data-al-dn]')?.value) || null;
    if(!id || (!upUser && !dnUser)){ toast('حداقل یک شرط وارد کنید', 'error'); return; }
    const up = upUser ? userToBase(upUser) : null;
    const dn = dnUser ? userToBase(dnUser) : null;
    const list = window.Storage.alerts.get();
    list.push({ id, up, dn, ts: Date.now() });
    window.Storage.alerts.save(list);
    render();
    toast('ذخیره شد ✓', 'success');
  });

  render();
}

function toolNotes(){
  const notes = window.Storage.notes.get() || '';

  openModal(`<span data-icon="note"></span> یادداشت‌ها`, `
    <textarea class="textarea" data-notes placeholder="یادداشت خود را بنویسید..." style="min-height:220px">${notes}</textarea>
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
    toast('ذخیره شد ✓', 'success');
    closeModal();
  });
}

function toolProfit(){
  const opts = window.DATA.ASSETS.slice(0, 50).map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  openModal(`<span data-icon="trendingUp"></span> محاسبه سود / زیان`, `
    <div class="form-group">
      <label>دارایی</label>
      <select class="select" data-pr-a>${opts}</select>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>قیمت خرید (${unitLabel()})</label>
        <input class="input" type="number" placeholder="قیمت واحد" data-pr-buy>
      </div>
      <div class="form-group">
        <label>مقدار</label>
        <input class="input" type="number" value="1" data-pr-qty>
      </div>
    </div>
    <div class="result-box" data-profit-out></div>
  `);

  function calc(){
    const id = $('[data-pr-a]')?.value;
    const buyUser = parseFloat($('[data-pr-buy]')?.value) || 0;
    const buyBase = userToBase(buyUser);
    const qty = parseFloat($('[data-pr-qty]')?.value) || 0;
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
    const pct = (pl / buyVal) * 100;
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
        <input class="input" type="number" value="100" step="0.1" data-zw>
      </div>
      <div class="form-group">
        <label>عیار</label>
        <select class="select" data-zk>
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
    const w = parseFloat($('[data-zw]')?.value) || 0;
    const k = parseFloat($('[data-zk]')?.value) || 18;
    const w24 = w * (k / 24);
    const out = $('[data-zakat-out]');
    const reached = w24 >= NISAB_GRAM_24K;

    if(!reached){
      if(out) out.innerHTML = `
        <div class="result-row"><span>معادل ۲۴ عیار</span><strong>${window.U.num(w24, 2)} گرم</strong></div>
        <div class="result-row"><span>نصاب شرعی</span><strong>${window.U.num(NISAB_GRAM_24K, 2)} گرم</strong></div>
        <div class="result-row result-total"><span>وضعیت</span><strong style="color:var(--warn)">به نصاب نرسیده</strong></div>
      `;
      return;
    }

    const pricePerGram = gold.price * (k / 18);
    const totalValue = w * pricePerGram;
    const zakat = totalValue * 0.025;

    if(out) out.innerHTML = `
      <div class="result-row"><span>معادل ۲۴ عیار</span><strong>${window.U.num(w24, 2)} گرم</strong></div>
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
      <select class="select" data-avg-a>${opts}</select>
    </div>
    <div id="avg-rows"></div>
    <button type="button" class="btn btn-ghost btn-block" data-avg-add style="margin-top:8px">
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
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 40px;gap:8px;margin-bottom:8px';
    row.innerHTML = `
      <input class="input" type="number" placeholder="قیمت (${unitLabel()})" data-avg-p>
      <input class="input" type="number" placeholder="مقدار" data-avg-q>
      <button type="button" class="btn btn-danger" data-avg-del style="padding:0;width:40px;font-size:18px">×</button>
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
      const pUser = parseFloat(row.querySelector('[data-avg-p]')?.value) || 0;
      const p = userToBase(pUser);
      const q = parseFloat(row.querySelector('[data-avg-q]')?.value) || 0;
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
      <div class="result-row"><span>مجموع مقدار</span><strong>${window.U.num(totalQty, 4)}</strong></div>
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

/* ============================================================
   OPEN TOOL
============================================================ */
function openTool(tool){
  if(tool === 'gold') toolGold();
  else if(tool === 'coin') toolCoin();
  else if(tool === 'ounce') toolOunce();
  else if(tool === 'silver') toolSilver();
  else if(tool === 'conv') toolConv();
  else if(tool === 'crypto-conv') toolCryptoConv();
  else if(tool === 'unit-conv') toolUnitConv();
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
   SEARCH — Inline
============================================================ */
let searchIdx = -1;
let searchResults = [];

function doSearch(query){
  const res = $('[data-search-results]');
  if(!res) return;

  const q = (query || '').trim().toLowerCase();

  if(!q || q.length < 2){
    res.hidden = true;
    res.innerHTML = '';
    searchResults = [];
    searchIdx = -1;
    return;
  }

  const list = window.DATA.ASSETS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.code.toLowerCase().includes(q) ||
    a.id.toLowerCase().includes(q)
  ).slice(0, 15);

  searchResults = list;
  searchIdx = list.length ? 0 : -1;

  if(!list.length){
    res.innerHTML = '<div class="ms-empty">نتیجه‌ای یافت نشد</div>';
    res.hidden = false;
    return;
  }

  res.innerHTML = list.map((a, i) => {
    const live = window.API.getById(a.id);
    const price = live && live.price != null ? formatPrice(a, live.price) : '—';
    return `
      <div class="ms-item ${i === 0 ? 'is-active' : ''}" data-idx="${i}">
        <div class="ms-item-icon">${assetIcon(a)}</div>
        <div class="ms-item-info">
          <strong>${window.U.esc(a.name)}</strong>
          <small>${a.code} · ${window.DATA.CATEGORIES[a.cat]?.label || ''}</small>
        </div>
        <div class="ms-item-price">${price}</div>
      </div>
    `;
  }).join('');
  res.hidden = false;

  res.querySelectorAll('.ms-item').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      pickSearch(searchResults[+el.dataset.idx]);
    });
  });
}

function pickSearch(asset){
  if(!asset) return;
  activeChartId = asset.id;
  closeSearch();
  go('chart');
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
  searchIdx = -1;
}

/* ============================================================
   EVENT HANDLING
============================================================ */
function handleClick(e){
  const menuBtn = e.target.closest('[data-menu]');
  if(menuBtn){
    e.preventDefault();
    e.stopPropagation();
    if(window.TV && window.TV.isActive()){
      window.TV.close();
      return;
    }
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
    if(!e.target.closest('.hdr-search-wrap')){
      closeSearch();
    }
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
    }
    else if(currentPage === 'chart'){
      renderChartPage();
    }
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

  const unitBtn = e.target.closest('[data-unit]');
  if(unitBtn){
    e.preventDefault();
    e.stopPropagation();
    const newUnit = unitBtn.dataset.unit;
    if(getUnit() === newUnit) return;
    
    window.CFG.set('currency', newUnit);
    $$('[data-unit]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.unit === newUnit);
    });
    
    // رفرش همه چیز با واحد جدید
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
    renderHomeChart();
  }
  if(currentPage === 'markets') renderMarkets();
  if(currentPage === 'chart') renderChartPage();
  if(currentPage === 'compare') renderCompare();
  if(currentPage === 'favorites') renderFavs();
  renderHdrTicker();
  if(window.TV && window.TV.isActive()) window.TV.refresh();
}

/* ============================================================
   HELPERS
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
      toast(`🔔 ${a?.name || al.id}`, 'warning');
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
  window.CFG.load();
  document.body.classList.toggle('dark', window.CFG.get('theme') === 'dark');

  if(window.Icons && window.Icons.hydrate) window.Icons.hydrate();
  if(window.Icons && window.Icons.installImageFallback) window.Icons.installImageFallback();

  // واحد
  const unit = getUnit();
  $$('[data-unit]').forEach(b => b.classList.toggle('is-active', b.dataset.unit === unit));

  // نام کاربر
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
    const results = $('[data-search-results]');
    if(results && !results.hidden){
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(searchIdx < searchResults.length - 1){ searchIdx++; }
        updateSearchActive();
      }
      if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(searchIdx > 0){ searchIdx--; }
        updateSearchActive();
      }
      if(e.key === 'Enter'){
        e.preventDefault();
        if(searchIdx >= 0) pickSearch(searchResults[searchIdx]);
      }
    }
  });

  const si = $('[data-search-input]');
  if(si){
    si.addEventListener('input', window.U.debounce(e => doSearch(e.target.value), 150));
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
    checkAlerts();
  });

  renderHdrTicker();
}

function updateSearchActive(){
  const res = $('[data-search-results]');
  if(!res) return;
  const items = res.querySelectorAll('.ms-item');
  items.forEach(it => it.classList.remove('is-active'));
  if(items[searchIdx]) items[searchIdx].classList.add('is-active');
}

/* ============================================================
   PUBLIC API
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
  getUserName,
  saveUserName,
  openTool,
  toolGold, toolCoin, toolOunce, toolSilver,
  toolConv, toolCryptoConv, toolUnitConv,
  toolPortfolio, toolAlerts, toolNotes,
  toolProfit, toolZakat, toolAvgBuy
};

})();


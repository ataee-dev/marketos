/**
 * قیمتو 5.6 — UI
 * ✅ جستجوی inline
 * ✅ Chart با سوالات (1h/24h/1w/1m)
 * ✅ پرتفوی افقی
 * ✅ زیرنویس متحرک در هدر
 * ✅ تومان همیشه
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
      <div class="m-card-price">${noPrice ? '—' : U.price(asset, price)}</div>
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
   PORTFOLIO — افقی
============================================================ */
function renderPortfolioCards(){
  const grid = $('[data-portfolio-grid]');
  if(!grid) return;

  const list = window.Storage.pf.get();

  if(!list.length){
    grid.innerHTML = `
      <div class="scroll-row portfolio-row">
        <button type="button" class="pf-card pf-card-add" data-tool="portfolio">
          <div class="pf-card-add-icon">${window.Icons.get('plus')}</div>
          <span>افزودن دارایی</span>
        </button>
      </div>
    `;
    return;
  }

  let totalBuy = 0, totalNow = 0;

  const cards = list.map(item => {
    const a = window.DATA.find(item.id);
    const l = window.API.getById(item.id);
    if(!a) return '';

    const price = (l && l.price != null) ? l.price : item.buyPrice;
    const bv = item.buyPrice * item.qty;
    const nv = price * item.qty;
    totalBuy += bv;
    totalNow += nv;

    const pl = nv - bv;
    const pct = bv > 0 ? (pl / bv) * 100 : 0;
    const up = pl >= 0;

    const colors = {
      gold:     { bg:'rgba(229,185,110,.14)', color:'#c8974a' },
      currency: { bg:'rgba(91,157,217,.12)',  color:'#3d7eb8' },
      crypto:   { bg:'rgba(155,125,219,.12)', color:'#7558b8' },
      metal:    { bg:'rgba(107,190,214,.12)', color:'#3d8ea8' },
      energy:   { bg:'rgba(232,165,92,.12)',  color:'#c87c3a' },
      commodity:{ bg:'rgba(16,162,110,.12)',  color:'#10a26e' },
      index:    { bg:'rgba(221,126,161,.12)', color:'#b85c7e' },
      goldCrypto:{ bg:'rgba(229,185,110,.14)',color:'#c8974a' }
    };
    const c = colors[a.cat] || colors.gold;

    return `
      <div class="pf-card" data-card-id="${a.id}">
        <div class="pf-card-head">
          <div class="pf-card-icon" style="--pf-color:${c.color};--pf-bg:${c.bg}">
            ${assetIcon(a)}
          </div>
          <div class="pf-card-info">
            <strong>${window.U.esc(a.short || a.name)}</strong>
            <small>${window.U.num(item.qty)} × ${window.U.price(a, item.buyPrice)}</small>
          </div>
        </div>
        <div class="pf-card-value">${window.U.price(a, nv)}</div>
        <div class="pf-card-sub">ارزش فعلی</div>
        <div class="pf-card-foot">
          <span class="pf-card-badge ${up ? 'up' : 'down'}">
            ${up ? '▲' : '▼'} ${up ? '+' : ''}${pct.toFixed(2)}%
          </span>
          <button type="button" class="icon-btn" data-pf-del="${item.ts}"
            style="width:24px;height:24px;font-size:13px;color:var(--muted);padding:0;background:none;border:0">
            ${window.Icons.get('trash')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  const pl = totalNow - totalBuy;
  const plPct = totalBuy > 0 ? (pl / totalBuy) * 100 : 0;
  const up = pl >= 0;

  const totalCard = `
    <div class="pf-card pf-card-total">
      <div class="pf-card-head">
        <div class="pf-card-icon" style="--pf-color:var(--accent);--pf-bg:var(--accent-soft)">
          ${window.Icons.get('briefcase')}
        </div>
        <div class="pf-card-info">
          <strong>مجموع پرتفوی</strong>
          <small>${window.U.num(list.length)} دارایی</small>
        </div>
      </div>
      <div class="pf-card-value">${window.U.money(totalNow)}</div>
      <div class="pf-card-sub">ارزش کل دارایی‌ها</div>
      <div class="pf-card-foot">
        <span class="pf-card-badge ${up ? 'up' : 'down'}">
          ${up ? '▲' : '▼'} ${up ? '+' : ''}${plPct.toFixed(2)}%
        </span>
        <small style="color:var(--muted);font-size:10px;direction:ltr">
          ${up ? '+' : ''}${window.U.money(Math.abs(pl))}
        </small>
      </div>
    </div>
  `;

  const addCard = `
    <button type="button" class="pf-card pf-card-add" data-tool="portfolio">
      <div class="pf-card-add-icon">${window.Icons.get('plus')}</div>
      <span>افزودن دارایی</span>
    </button>
  `;

  grid.innerHTML = `
    <div class="scroll-row portfolio-row">
      ${totalCard}
      ${cards}
      ${addCard}
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
   HEADER TICKER (زیرنویس متحرک)
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
        <span class="price">${window.U.price(a, l.price)}</span>
        <span class="chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(cp).toFixed(2)}%</span>
      </div>
    `;
  }).filter(Boolean).join('');

  // تکرار برای اسکرول بی‌نهایت
  track.innerHTML = items + items;
}

/* ============================================================
   CHART PAGE — بازطراحی کامل با سوالات
============================================================ */
async function renderChartPage(){
  const asset = window.DATA.find(activeChartId);
  if(!asset) return;

  const live = window.API.getById(asset.id);

  // ۱. هدر نماد
  const iconEl = $('[data-c-icon]');
  if(iconEl) iconEl.innerHTML = assetIcon(asset);

  const nameEl = $('[data-c-name]');
  if(nameEl) nameEl.textContent = asset.name;

  const codeEl = $('[data-c-code]');
  if(codeEl) codeEl.textContent = asset.code;

  // ۲. دکمه علاقه‌مندی
  const favEl = $('[data-c-fav]');
  if(favEl){
    const isFav = window.Storage.fav.get().includes(asset.id);
    favEl.classList.toggle('is-fav', isFav);
    favEl.dataset.favToggle = asset.id;
    favEl.textContent = isFav ? '★' : '☆';
  }

  // ۳. قیمت اصلی
  const priceEl = $('[data-c-price]');
  if(priceEl){
    priceEl.textContent = live && live.price != null ? window.U.price(asset, live.price) : '—';
  }

  // ۴. تغییرات
  const changeEl = $('[data-c-change]');
  if(changeEl && live && live.changePercent != null){
    const up = live.changePercent >= 0;
    changeEl.textContent = (up ? '▲' : '▼') + ' ' + Math.abs(live.changePercent).toFixed(2) + '%';
    changeEl.className = 'chart-change ' + (up ? 'up' : 'down');
  } else if(changeEl){
    changeEl.textContent = '—';
    changeEl.className = 'chart-change';
  }

  // ۵. آمار
  function fmt(v){
    if(v == null) return '—';
    return asset.ptype === 'usd' ? '$' + window.U.num(v, asset.dec) : window.U.money(v);
  }

  const highEl = $('[data-c-high]');
  if(highEl) highEl.textContent = fmt(live && live.high);

  const lowEl = $('[data-c-low]');
  if(lowEl) lowEl.textContent = fmt(live && live.low);

  const deltaEl = $('[data-c-delta]');
  if(deltaEl){
    if(live && live.change != null){
      const up = live.change >= 0;
      deltaEl.textContent = (up ? '+' : '') + fmt(Math.abs(live.change));
      deltaEl.style.color = up ? 'var(--up)' : 'var(--down)';
    } else {
      deltaEl.textContent = '—';
    }
  }

  const avgEl = $('[data-c-avg]');
  if(avgEl){
    if(live && live.high != null && live.low != null){
      avgEl.textContent = fmt((live.high + live.low) / 2);
    } else {
      avgEl.textContent = '—';
    }
  }

  // ۶. اطلاعات بیشتر
  const unitEl = $('[data-c-unit]');
  if(unitEl) unitEl.textContent = asset.unit || '—';

  const catEl = $('[data-c-cat]');
  if(catEl){
    const cat = window.DATA.CATEGORIES[asset.cat];
    catEl.textContent = cat ? cat.label : asset.cat;
  }

  const timeEl = $('[data-c-time]');
  if(timeEl) timeEl.textContent = live && live.time ? live.time : '—';

  // ۷. نمودار
  const canvas = $('[data-chart-canvas]');
  if(canvas) drawChartAsync(canvas, asset);

  // ۸. سوالات (تغییرات در بازه‌های زمانی)
  renderChartQuestions(asset, live);

  // ۹. نمادهای مرتبط
  const relEl = $('[data-c-related]');
  if(relEl){
    const related = window.DATA.byCat(asset.cat)
      .filter(a => a.id !== asset.id)
      .slice(0, 10);
    relEl.innerHTML = related.map(marketCardHTML).join('');
  }
}

/**
 * رندر سوالات صفحه Chart
 */
async function renderChartQuestions(asset, live){
  if(!live || live.price == null) return;

  const currentPrice = live.price;

  // بازه‌های زمانی به میلی‌ثانیه
  const intervals = {
    '1h':  1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '1w':  7 * 24 * 60 * 60 * 1000,
    '1m':  30 * 24 * 60 * 60 * 1000
  };

  for(const [key, ms] of Object.entries(intervals)){
    const item = document.querySelector(`[data-q="${key}"]`);
    if(!item) continue;

    const priceEl = item.querySelector('[data-q-price]');
    const changeEl = item.querySelector('[data-q-change]');

    try {
      // از تاریخچه استفاده کن
      let pastPrice = null;

      if(window.API.getHistory){
        // تعداد روز بر اساس بازه
        const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
        const history = await window.API.getHistory(asset, days);

        if(history && history.length){
          // پیدا کن نزدیک‌ترین نقطه به زمان هدف
          const targetTime = Date.now() - ms;
          let closest = null;
          let minDiff = Infinity;

          for(const point of history){
            const diff = Math.abs(point.t - targetTime);
            if(diff < minDiff){
              minDiff = diff;
              closest = point;
            }
          }

          if(closest && closest.p){
            pastPrice = closest.p;
          }
        }
      }

      // اگه تاریخچه نبود، از داده fallback استفاده کن
      if(pastPrice == null){
        pastPrice = currentPrice * (1 - (live.changePercent || 0) / 100 * (key === '1h' ? 0.1 : key === '24h' ? 1 : key === '1w' ? 3 : 7));
      }

      // محاسبه تغییر
      const change = currentPrice - pastPrice;
      const changePct = (change / pastPrice) * 100;
      const up = change >= 0;

      if(priceEl) priceEl.textContent = window.U.price(asset, pastPrice);
      if(changeEl){
        changeEl.textContent = (up ? '▲' : '▼') + ' ' + Math.abs(changePct).toFixed(2) + '%';
        changeEl.className = 'chart-q-change ' + (up ? 'up' : 'down');
      }

    } catch(e){
      console.warn('[ChartQ] Failed for', key, e.message);
      if(priceEl) priceEl.textContent = '—';
      if(changeEl){
        changeEl.textContent = '—';
        changeEl.className = 'chart-q-change muted';
      }
    }
  }
}

/**
 * رسم نمودار async — از history + رنگ بر اساس جهت
 */
async function drawChartAsync(canvas, asset){
  try {
    let prices = null;

    if(window.API.getHistoryPrices){
      prices = await window.API.getHistoryPrices(asset, 7);
    }

    if(!prices || prices.length < 2){
      prices = window.API.history(asset, 60, window.CFG.get('chartPeriod') || '1D');
    }

    // تعیین رنگ بر اساس جهت (نزولی = قرمز، صعودی = سبز)
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
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr">${lA ? window.U.price(A, lA.price) : '—'}</strong>
      </div>
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">تغییر ${A.code}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr;color:${(lA?.changePercent || 0) >= 0 ? 'var(--up)' : 'var(--down)'}">
          ${(lA?.changePercent || 0) >= 0 ? '+' : ''}${(lA?.changePercent || 0).toFixed(2)}%
        </strong>
      </div>
      <div style="padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border)">
        <small style="display:block;font-size:11.5px;color:var(--muted);margin-bottom:6px;font-weight:600">${window.U.esc(B.name)}</small>
        <strong style="display:block;font-size:16px;font-weight:800;direction:ltr">${lB ? window.U.price(B, lB.price) : '—'}</strong>
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
    renderPortfolioCards();
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
   MODAL
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

/* ============================================================
   TOAST
============================================================ */
function toast(msg, type = ''){
  const t = $('[data-toast]');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast is-show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('is-show'), 2400);
}

/* ============================================================
   TOOLS
============================================================ */
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
      <div class="result-row"><span>ارزش طلا</span><strong>${window.U.money(val)}</strong></div>
      <div class="result-row"><span>اجرت (${wg}%)</span><strong>${window.U.money(wA)}</strong></div>
      <div class="result-row"><span>سود (${pr}%)</span><strong>${window.U.money(pA)}</strong></div>
      <div class="result-row"><span>مالیات (${tx}%)</span><strong>${window.U.money(tA)}</strong></div>
      <div class="result-row result-total"><span>مبلغ نهایی</span><strong>${window.U.money(tot)}</strong></div>
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
      <div class="result-row"><span>قیمت واحد</span><strong>${window.U.money(live.price)}</strong></div>
      <div class="result-row"><span>تعداد</span><strong>${window.U.num(n)} عدد</strong></div>
      <div class="result-row result-total"><span>ارزش کل</span><strong>${window.U.money(tot)}</strong></div>
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
      <div class="result-row"><span>ارزش تومانی</span><strong>${window.U.money(totalRial)}</strong></div>
      <div class="result-row"><span>هر گرم ۲۴ عیار</span><strong>${window.U.money(gramPrice)}</strong></div>
      <div class="result-row result-total"><span>هر گرم ${k} عیار</span><strong>${window.U.money(gramK)}</strong></div>
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
      <div class="result-row"><span>هر گرم</span><strong>${window.U.money(pricePerGram)}</strong></div>
      <div class="result-row result-total"><span>ارزش ${w} گرم</span><strong>${window.U.money(total)}</strong></div>
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
      <label>مقدار</label>
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
    const amt = parseFloat($('[data-va]')?.value) || 0;
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
    const res = (amt * lf.price) / lt.price;
    if(out) out.innerHTML = `
      <div class="result-row"><span>${window.U.num(amt, 2)} ${f.code}</span><strong>${window.U.num(res, 4)} ${t.code}</strong></div>
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
      ${tomanVal ? `<div class="result-row result-total"><span>ارزش تومانی</span><strong>${window.U.money(tomanVal)}</strong></div>` : ''}
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
        <label>قیمت خرید (اختیاری)</label>
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
              <small style="font-size:11px;color:var(--muted)">${window.U.num(item.qty)} × ${window.U.price(a, item.buyPrice)}</small>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="text-align:end">
              <strong style="display:block;font-size:13px;direction:ltr">${window.U.price(a, nv)}</strong>
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
        renderPortfolioCards();
      });
    });
  }

  $('[data-padd]')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const id = $('[data-pa]')?.value;
    const qty = parseFloat($('[data-pq]')?.value);
    const pp = parseFloat($('[data-pp]')?.value);
    if(!id || !qty || qty <= 0){ toast('مقدار را وارد کنید', 'error'); return; }
    let buy = pp;
    if(!buy || isNaN(buy)){
      const l = window.API.getById(id);
      if(!l || l.price == null){ toast('قیمت در دسترس نیست', 'error'); return; }
      buy = l.price;
    }
    const list = window.Storage.pf.get();
    list.push({ id, qty, buyPrice: buy, ts: Date.now() });
    window.Storage.pf.save(list);
    render();
    renderPortfolioCards();
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
        <label>بالاتر از</label>
        <input class="input" type="number" data-al-up>
      </div>
      <div class="form-group">
        <label>پایین‌تر از</label>
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
      if(al.up) parts.push('بالاتر از ' + window.U.money(al.up));
      if(al.dn) parts.push('پایین‌تر از ' + window.U.money(al.dn));
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
    const up = parseFloat($('[data-al-up]')?.value) || null;
    const dn = parseFloat($('[data-al-dn]')?.value) || null;
    if(!id || (!up && !dn)){ toast('حداقل یک شرط وارد کنید', 'error'); return; }
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
        <label>قیمت خرید</label>
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
    const buy = parseFloat($('[data-pr-buy]')?.value) || 0;
    const qty = parseFloat($('[data-pr-qty]')?.value) || 0;
    const a = window.DATA.find(id);
    const l = window.API.getById(id);
    const out = $('[data-profit-out]');
    if(!a || !l || l.price == null || !buy || !qty){
      if(out) out.innerHTML = '<div class="result-row"><span>قیمت خرید و مقدار را وارد کنید</span></div>';
      return;
    }
    const nowVal = l.price * qty;
    const buyVal = buy * qty;
    const pl = nowVal - buyVal;
    const pct = (pl / buyVal) * 100;
    const up = pl >= 0;

    if(out) out.innerHTML = `
      <div class="result-row"><span>ارزش خرید</span><strong>${window.U.price(a, buyVal)}</strong></div>
      <div class="result-row"><span>ارزش فعلی</span><strong>${window.U.price(a, nowVal)}</strong></div>
      <div class="result-row result-total">
        <span>${up ? 'سود' : 'زیان'}</span>
        <strong style="color:${up ? 'var(--up)' : 'var(--down)'}">
          ${up ? '+' : ''}${window.U.price(a, Math.abs(pl))} (${up ? '+' : ''}${pct.toFixed(2)}%)
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
      <div class="result-row"><span>ارزش کل</span><strong>${window.U.money(totalValue)}</strong></div>
      <div class="result-row"><span>نرخ زکات</span><strong>۲.۵٪</strong></div>
      <div class="result-row result-total"><span>زکات واجب</span><strong>${window.U.money(zakat)}</strong></div>
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

  function addRow(price = '', qty = ''){
    const wrap = $('#avg-rows');
    if(!wrap) return;
    const row = document.createElement('div');
    row.setAttribute('data-avg-row', '');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 40px;gap:8px;margin-bottom:8px';
    row.innerHTML = `
      <input class="input" type="number" placeholder="قیمت" value="${price}" data-avg-p>
      <input class="input" type="number" placeholder="مقدار" value="${qty}" data-avg-q>
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
      const p = parseFloat(row.querySelector('[data-avg-p]')?.value) || 0;
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
      <div class="result-row"><span>مجموع هزینه</span><strong>${window.U.price(a, totalCost)}</strong></div>
      <div class="result-row"><span>میانگین خرید</span><strong>${window.U.price(a, avg)}</strong></div>
      ${l && l.price != null ? `
        <div class="result-row"><span>قیمت فعلی</span><strong>${window.U.price(a, l.price)}</strong></div>
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
    const price = live && live.price != null ? window.U.price(a, live.price) : '—';
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
    renderPortfolioCards();
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
    renderPortfolioCards();
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

  // زیرنویس اولیه
  renderHdrTicker();
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
  renderPortfolioCards,
  renderFeatured,
  renderMostUsed,
  renderTools,
  renderCats,
  renderHdrTicker,
  openTool,
  toolGold, toolCoin, toolOunce, toolSilver,
  toolConv, toolCryptoConv, toolUnitConv,
  toolPortfolio, toolAlerts, toolNotes,
  toolProfit, toolZakat, toolAvgBuy
};

})();
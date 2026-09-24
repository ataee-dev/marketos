/**
 * قیمتو 4.0 — TV MODE
 * 8 چیدمان + تنظیمات + زیرنویس + progress
 * ✅ رفع باگ: تنظیمات، منو، تداخل event
 */
window.TV = (function(){
'use strict';

const LAYOUTS = [
  {id:'card',     name:'کارت بزرگ',    icon:'file'},
  {id:'table',    name:'جدول بورسی',   icon:'list'},
  {id:'grid-2x2', name:'شبکه ۲×۲',    icon:'grid'},
  {id:'grid-3x2', name:'شبکه ۳×۲',    icon:'grid'},
  {id:'grid-4x2', name:'شبکه ۴×۲',    icon:'grid'},
  {id:'focus',    name:'فوکوس',        icon:'eye'},
  {id:'heatmap',  name:'نقشه حرارتی',  icon:'activity'},
  {id:'compact',  name:'کارت‌های متراکم',icon:'grid'}
];

const state = {
  active: false,
  idx: 0,
  timer: null,
  raf: null,
  start: 0,
  layout: 'card',
  auto: true,
  chart: true,
  ticker: true,
  interval: 10,
  assets: []
};

let root, body, prog, label, tickerEl;
let settingsModal = null;

/* ============================================================
   INIT
============================================================ */
function init(){
  root = document.querySelector('[data-tv]');
  if(!root) return;

  body = root.querySelector('[data-tv-body]');
  prog = root.querySelector('[data-tv-progress]');
  label = root.querySelector('[data-tv-label]');
  tickerEl = root.querySelector('[data-tv-ticker]');

  try {
    const saved = JSON.parse(localStorage.getItem('gheymato.tv') || '{}');
    Object.assign(state, saved);
  } catch(e){}

  if(!state.assets || !state.assets.length){
    state.assets = window.DATA.FEATURED
      .concat(window.DATA.MOST_USED)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 20);
  }

  /* ==========================================================
     ✅ همه listener ها با stopPropagation
  ========================================================== */

  // Close
  const closeBtn = root.querySelector('[data-tv-close]');
  if(closeBtn){
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      close();
    }, true);
  }

  // Prev
  const prevBtn = root.querySelector('[data-tv-prev]');
  if(prevBtn){
    prevBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      prev();
    }, true);
  }

  // Next
  const nextBtn = root.querySelector('[data-tv-next]');
  if(nextBtn){
    nextBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      next();
    }, true);
  }

  // Auto
  const autoBtn = root.querySelector('[data-tv-auto]');
  if(autoBtn){
    autoBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleAuto();
    }, true);
  }

  // ✅ Settings — مهم‌ترین بخش
  const settingsBtn = root.querySelector('[data-tv-settings]');
  if(settingsBtn){
    settingsBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
      openSettings();
    }, true);
  }

  // Body click → next (اگه روی دکمه نبود)
  if(body){
    body.addEventListener('click', e => {
      if(e.target.closest('button') ||
         e.target.closest('.tv-mini-card') ||
         e.target.closest('.tv-table-row') ||
         e.target.closest('.tv-heat-cell') ||
         e.target.closest('.tv-compact-card') ||
         e.target.closest('.tv-grid-card')) return;
      next();
    });
  }

  // Keyboard
  document.addEventListener('keydown', e => {
    if(!state.active) return;
    if(e.key === 'Escape'){ close(); return; }
    if(e.key === 'ArrowRight'){ next(); return; }
    if(e.key === 'ArrowLeft'){ prev(); return; }
    if(e.key === ' '){ e.preventDefault(); toggleAuto(); return; }
    if(e.key.toLowerCase() === 's'){ openSettings(); return; }
  });

  console.log('[TV] ✓ آماده');
}

/* ============================================================
   OPEN / CLOSE
============================================================ */
function open(){
  if(!root) return;
  if(state.active) return;

  state.active = true;
  root.hidden = false;

  // بستن sidebar اگه بازه
  document.body.classList.remove('sidebar-open');

  state.idx = 0;
  render();
  renderTicker();
  startTimer();

  console.log('[TV] ▶ شروع شد');
}

function close(){
  if(!root) return;
  if(!state.active) return;

  state.active = false;
  root.hidden = true;
  stopTimer();

  console.log('[TV] ⏸ بسته شد');
}

function isActive(){ return state.active; }

/* ============================================================
   RENDER
============================================================ */
function render(){
  if(!body) return;
  const list = state.assets.filter(id => window.DATA.find(id));
  if(!list.length) return;

  const lay = LAYOUTS.find(l => l.id === state.layout);
  if(label) label.textContent = lay ? lay.name : 'نمایش زنده';

  body.innerHTML = '';

  switch(state.layout){
    case 'card':     return renderCard(list);
    case 'table':    return renderTable(list);
    case 'grid-2x2': return renderGrid(list, 4, 'tv-grid');
    case 'grid-3x2': return renderGrid(list, 6, 'tv-grid-3x2');
    case 'grid-4x2': return renderGrid(list, 8, 'tv-grid-4x2');
    case 'focus':    return renderFocus(list);
    case 'heatmap':  return renderHeatmap(list);
    case 'compact':  return renderCompact(list);
    default:         return renderCard(list);
  }
}

/* ============================================================
   RENDER: CARD
============================================================ */
function renderCard(list){
  const asset = window.DATA.find(list[state.idx]);
  if(!asset) return;
  const live = window.API.getById(asset.id);
  if(!live) return;

  const up = (live.changePercent || 0) >= 0;
  const c = document.createElement('div');
  c.className = 'tv-card';

  const others = list.filter(id => id !== asset.id).slice(0, 4);

  c.innerHTML = `
    <div class="tv-icon">${window.Icons.assetSVG(asset)}</div>
    <div class="tv-name">${window.U.esc(asset.name)}</div>
    <div class="tv-price">${window.U.price(asset, live.price)}</div>
    <div class="tv-change ${up?'up':'down'}">
      ${up?'▲':'▼'} ${Math.abs(live.changePercent || 0).toFixed(2)}%
    </div>
    ${state.chart ? '<canvas class="tv-chart" style="width:min(900px,90vw);height:200px;margin:20px 0"></canvas>' : ''}
    <div class="tv-mini-grid">
      ${others.map(id => {
        const a = window.DATA.find(id);
        const l = window.API.getById(id);
        const u = (l?.changePercent || 0) >= 0;
        return `
          <div class="tv-mini-card" data-tv-jump="${a.id}">
            <div class="tv-mini-name">${window.U.esc(a.short || a.name)}</div>
            <div class="tv-mini-price">${window.U.price(a, l?.price)}</div>
            <div class="tv-mini-chg ${u?'up':'down'}">${u?'▲':'▼'} ${Math.abs(l?.changePercent||0).toFixed(2)}%</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  body.appendChild(c);

  if(state.chart){
    const canvas = c.querySelector('canvas');
    if(canvas){
      requestAnimationFrame(() => {
        const data = window.API.history(asset, 120, '1D');
        window.Charts.drawLine(canvas, data, {padding:24, lineWidth:3});
      });
    }
  }

  c.querySelectorAll('[data-tv-jump]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      jumpTo(el.dataset.tvJump);
    });
  });
}

/* ============================================================
   RENDER: TABLE
============================================================ */
function renderTable(list){
  const c = document.createElement('div');
  c.className = 'tv-table';

  const items = state.assets.filter(id => window.DATA.find(id)).slice(0, 30);

  c.innerHTML = `
    <div class="tv-table-head">
      <div>#</div>
      <div>دارایی</div>
      <div>قیمت</div>
      <div>تغییر</div>
      <div>بالاترین</div>
      <div>کمترین</div>
      <div>زمان</div>
    </div>
    <div class="tv-table-body">
      ${items.map((id, i) => {
        const a = window.DATA.find(id);
        const l = window.API.getById(id);
        const up = (l?.changePercent || 0) >= 0;
        return `
          <div class="tv-table-row" data-tv-jump="${a.id}">
            <div class="tv-table-rank">${i + 1}</div>
            <div class="tv-table-name">
              <div class="tv-table-icon">${window.Icons.assetSVG(a)}</div>
              <span>${window.U.esc(a.name)}</span>
            </div>
            <div class="tv-table-price">${window.U.price(a, l?.price)}</div>
            <div class="tv-table-chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(l?.changePercent||0).toFixed(2)}%</div>
            <div class="tv-table-high">${l?.high != null ? window.U.price(a, l.high) : '—'}</div>
            <div class="tv-table-low">${l?.low != null ? window.U.price(a, l.low) : '—'}</div>
            <div class="tv-table-time">${l?.time || '—'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  body.appendChild(c);

  c.querySelectorAll('[data-tv-jump]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      jumpTo(el.dataset.tvJump);
    });
  });
}

/* ============================================================
   RENDER: GRID
============================================================ */
function renderGrid(list, count, className){
  const c = document.createElement('div');
  c.className = className;

  const items = state.assets.filter(id => window.DATA.find(id)).slice(0, count);

  c.innerHTML = items.map(id => {
    const a = window.DATA.find(id);
    const l = window.API.getById(id);
    const up = (l?.changePercent || 0) >= 0;
    return `
      <div class="tv-grid-card" data-tv-jump="${a.id}">
        <div class="tv-grid-head">
          <div class="tv-grid-icon">${window.Icons.assetSVG(a)}</div>
          <span>${window.U.esc(a.short || a.name)}</span>
        </div>
        <div class="tv-grid-price">${window.U.price(a, l?.price)}</div>
        <div class="tv-grid-chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(l?.changePercent||0).toFixed(2)}%</div>
      </div>
    `;
  }).join('');

  body.appendChild(c);

  c.querySelectorAll('[data-tv-jump]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      jumpTo(el.dataset.tvJump);
    });
  });
}

/* ============================================================
   RENDER: FOCUS
============================================================ */
function renderFocus(list){
  const asset = window.DATA.find(list[state.idx]);
  if(!asset) return;
  const l = window.API.getById(asset.id);
  if(!l) return;
  const up = (l.changePercent || 0) >= 0;

  const c = document.createElement('div');
  c.className = 'tv-focus';
  c.innerHTML = `
    <div class="tv-focus-icon">${window.Icons.assetSVG(asset)}</div>
    <div class="tv-focus-name">${window.U.esc(asset.name)}</div>
    <div class="tv-focus-price">${window.U.price(asset, l.price)}</div>
    <div class="tv-focus-chg ${up?'up':'down'}">
      ${up?'▲':'▼'} ${Math.abs(l.changePercent || 0).toFixed(2)}%
    </div>
  `;
  body.appendChild(c);
}

/* ============================================================
   RENDER: HEATMAP
============================================================ */
function renderHeatmap(list){
  const c = document.createElement('div');
  c.className = 'tv-heatmap';

  const items = state.assets.filter(id => window.DATA.find(id)).slice(0, 40);

  c.innerHTML = items.map(id => {
    const a = window.DATA.find(id);
    const l = window.API.getById(id);
    const chg = l?.changePercent || 0;
    const cls = chg > 0.5 ? 'up' : (chg < -0.5 ? 'down' : 'neutral');
    return `
      <div class="tv-heat-cell ${cls}" data-tv-jump="${a.id}">
        <div class="tv-heat-name">${window.U.esc(a.short || a.name)}</div>
        <div class="tv-heat-price">${window.U.price(a, l?.price)}</div>
        <div class="tv-heat-chg ${chg>=0?'up':'down'}">${chg>=0?'+':''}${chg.toFixed(2)}%</div>
      </div>
    `;
  }).join('');

  body.appendChild(c);

  c.querySelectorAll('[data-tv-jump]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      jumpTo(el.dataset.tvJump);
    });
  });
}

/* ============================================================
   RENDER: COMPACT
============================================================ */
function renderCompact(list){
  const c = document.createElement('div');
  c.className = 'tv-compact';

  const items = state.assets.filter(id => window.DATA.find(id)).slice(0, 24);

  c.innerHTML = items.map(id => {
    const a = window.DATA.find(id);
    const l = window.API.getById(id);
    const up = (l?.changePercent || 0) >= 0;
    return `
      <div class="tv-compact-card" data-tv-jump="${a.id}">
        <div class="tv-compact-head">
          <div class="tv-compact-icon">${window.Icons.assetSVG(a)}</div>
          <div class="tv-compact-name">${window.U.esc(a.short || a.name)}</div>
        </div>
        <div class="tv-compact-price">${window.U.price(a, l?.price)}</div>
        <div class="tv-compact-chg ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(l?.changePercent||0).toFixed(2)}%</div>
      </div>
    `;
  }).join('');

  body.appendChild(c);

  c.querySelectorAll('[data-tv-jump]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      jumpTo(el.dataset.tvJump);
    });
  });
}

/* ============================================================
   TICKER
============================================================ */
function renderTicker(){
  if(!tickerEl) return;
  if(!state.ticker){ tickerEl.style.display = 'none'; return; }
  tickerEl.style.display = 'flex';

  const items = state.assets.filter(id => window.DATA.find(id));

  tickerEl.innerHTML = `
    <div class="tv-ticker-track">
      ${items.concat(items).map(id => {
        const a = window.DATA.find(id);
        const l = window.API.getById(id);
        const chg = l?.changePercent || 0;
        const up = chg >= 0;
        return `
          <div class="tv-ticker-item">
            <span class="name">${window.U.esc(a.short || a.name)}</span>
            <span class="price">${window.U.price(a, l?.price)}</span>
            <span class="chg ${up?'up':'down'}">${up?'+':''}${chg.toFixed(2)}%</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ============================================================
   NAVIGATION
============================================================ */
function next(){
  const list = state.assets.filter(id => window.DATA.find(id));
  if(!list.length) return;
  if(state.layout === 'card' || state.layout === 'focus'){
    state.idx = (state.idx + 1) % list.length;
    render();
  }
  state.start = performance.now();
}

function prev(){
  const list = state.assets.filter(id => window.DATA.find(id));
  if(!list.length) return;
  if(state.layout === 'card' || state.layout === 'focus'){
    state.idx = (state.idx - 1 + list.length) % list.length;
    render();
  }
  state.start = performance.now();
}

function jumpTo(id){
  const list = state.assets.filter(x => window.DATA.find(x));
  const i = list.indexOf(id);
  if(i === -1) return;
  state.idx = i;
  render();
  state.start = performance.now();
}

/* ============================================================
   TIMER
============================================================ */
function startTimer(){
  stopTimer();
  if(!state.auto){ if(prog) prog.style.width = '0%'; return; }
  const ms = (state.interval || 10) * 1000;
  state.start = performance.now();
  tickProgress();
  state.timer = setInterval(() => {
    next();
    state.start = performance.now();
  }, ms);
}

function stopTimer(){
  if(state.timer){ clearInterval(state.timer); state.timer = null; }
  if(state.raf){ cancelAnimationFrame(state.raf); state.raf = null; }
}

function tickProgress(){
  if(!prog) return;
  const ms = (state.interval || 10) * 1000;
  const tick = now => {
    const p = Math.min(100, ((now - state.start) / ms) * 100);
    prog.style.width = p + '%';
    if(p < 100) state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}

function toggleAuto(){
  state.auto = !state.auto;
  save();
  if(state.auto) startTimer(); else stopTimer();
  if(window.UI && window.UI.toast){
    window.UI.toast(state.auto ? 'تعویض خودکار فعال' : 'غیرفعال');
  }
}

/* ============================================================
   ✅ SETTINGS MODAL
============================================================ */
function openSettings(){
  if(!window.UI || !window.UI.openModal){
    console.warn('[TV] UI.openModal not available');
    return;
  }

  const layoutsHTML = LAYOUTS.map(l => `
    <button type="button" class="tv-layout-btn ${state.layout === l.id ? 'is-active' : ''}"
            data-tv-set-layout="${l.id}">
      ${window.Icons.get(l.icon)}
      <span>${l.name}</span>
    </button>
  `).join('');

  window.UI.openModal(
    `<span data-icon="settings"></span> تنظیمات حالت TV`,
    `
      <div class="tv-set-group">
        <h4>چیدمان نمایش</h4>
        <div class="tv-layout-grid">${layoutsHTML}</div>
      </div>

      <div class="tv-set-group">
        <h4>تنظیمات کلی</h4>
        <div class="set-row">
          <div><span>تعویض خودکار</span><small>بین نمادها بچرخد</small></div>
          <button type="button" class="switch ${state.auto ? 'is-on' : ''}" data-tv-set="auto"></button>
        </div>
        <div class="set-row">
          <div><span>نمایش نمودار</span><small>در چیدمان کارت بزرگ</small></div>
          <button type="button" class="switch ${state.chart ? 'is-on' : ''}" data-tv-set="chart"></button>
        </div>
        <div class="set-row">
          <div><span>زیرنویس</span><small>نوار متحرک قیمت‌ها</small></div>
          <button type="button" class="switch ${state.ticker ? 'is-on' : ''}" data-tv-set="ticker"></button>
        </div>
        <div class="set-row">
          <div><span>فاصله تعویض</span><small>ثانیه</small></div>
          <select class="select" data-tv-set="interval" style="width:130px">
            <option value="5" ${state.interval === 5 ? 'selected' : ''}>۵ ثانیه</option>
            <option value="10" ${state.interval === 10 ? 'selected' : ''}>۱۰ ثانیه</option>
            <option value="15" ${state.interval === 15 ? 'selected' : ''}>۱۵ ثانیه</option>
            <option value="30" ${state.interval === 30 ? 'selected' : ''}>۳۰ ثانیه</option>
            <option value="60" ${state.interval === 60 ? 'selected' : ''}>۶۰ ثانیه</option>
          </select>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-block" data-tv-save>
        <span data-icon="check"></span>
        ذخیره و بستن
      </button>
    `
  );

  // ✅ Bind after modal opened
  setTimeout(() => {
    const modalBody = document.querySelector('[data-modal-body]');
    if(!modalBody) return;

    // Layouts
    modalBody.querySelectorAll('[data-tv-set-layout]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        state.layout = btn.dataset.tvSetLayout;
        save();
        modalBody.querySelectorAll('[data-tv-set-layout]').forEach(b => {
          b.classList.toggle('is-active', b === btn);
        });
        if(state.active) render();
      });
    });

    // Switches
    modalBody.querySelectorAll('.switch[data-tv-set]').forEach(sw => {
      sw.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const key = sw.dataset.tvSet;
        state[key] = !state[key];
        sw.classList.toggle('is-on', state[key]);
        save();
        if(key === 'ticker'){ if(state.active) renderTicker(); }
        else if(state.active) render();
        if(key === 'auto' && state.active){
          if(state.auto) startTimer(); else stopTimer();
        }
      });
    });

    // Interval select
    const sel = modalBody.querySelector('select[data-tv-set="interval"]');
    if(sel){
      sel.addEventListener('change', e => {
        state.interval = parseInt(e.target.value) || 10;
        save();
        if(state.active) startTimer();
      });
    }

    // Save button
    const saveBtn = modalBody.querySelector('[data-tv-save]');
    if(saveBtn){
      saveBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.UI.closeModal();
      });
    }
  }, 50);
}

/* ============================================================
   SAVE
============================================================ */
function save(){
  try {
    localStorage.setItem('gheymato.tv', JSON.stringify({
      layout: state.layout,
      auto: state.auto,
      chart: state.chart,
      ticker: state.ticker,
      interval: state.interval,
      assets: state.assets
    }));
  } catch(e){}
}

/* ============================================================
   REFRESH
============================================================ */
function refresh(){
  if(!state.active) return;
  render();
  renderTicker();
}

/* ============================================================
   PUBLIC
============================================================ */
return {
  init, open, close, isActive,
  render, refresh,
  next, prev, jumpTo,
  toggleAuto, openSettings,
  state, LAYOUTS
};

})();
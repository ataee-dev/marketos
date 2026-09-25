/**
 * قیمتو 6.0 — CHARTS (نسخه کامل و نهایی)
 * ✅ نقاط قابل کلیک و هاور
 * ✅ Tooltip با تاریخ شمسی و میلادی + قیمت
 * ✅ خط راهنما (Crosshair) عمودی
 * ✅ پشتیبانی از Mouse و Touch
 * ✅ سازگار با داده‌های annual-history.json و history/
 * ✅ رسم مجدد بهینه (بدون پرش)
 */

window.Charts = (function(){
'use strict';

/* ============================================================
   STATE
============================================================ */
let tooltipEl = null;
let crosshairEl = null;
let activeCanvas = null;

/* ============================================================
   SETUP CANVAS
============================================================ */
function setup(canvas){
  if(!canvas) return null;
  const r = canvas.getBoundingClientRect();
  if(!r.width || !r.height) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = r.width, h = r.height;

  if(canvas.width !== w * dpr || canvas.height !== h * dpr){
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  return { ctx, w, h, dpr };
}

/* ============================================================
   HELPERS
============================================================ */
function hexRgba(hex, a){
  if(!hex) return 'rgba(16,185,129,' + a + ')';
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/* ============================================================
   TOOLTIP — ساخت المان
============================================================ */
function getTooltip(){
  if(tooltipEl && document.body.contains(tooltipEl)) return tooltipEl;

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'chart-tooltip';
  tooltipEl.style.cssText = [
    'position:fixed',
    'padding:10px 14px',
    'border-radius:12px',
    'background:rgba(10,19,16,0.98)',
    'color:#fff',
    'font-size:12px',
    'font-weight:700',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity .15s ease',
    'z-index:10000',
    'direction:rtl',
    'white-space:nowrap',
    'border:1px solid rgba(16,185,129,0.5)',
    'box-shadow:0 10px 30px rgba(0,0,0,0.6)',
    'backdrop-filter:blur(12px)',
    '-webkit-backdrop-filter:blur(12px)',
    'font-family:Dana,sans-serif',
    'line-height:1.5'
  ].join(';');

  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

/* ============================================================
   CROSSHAIR — خط راهنما
============================================================ */
function getCrosshair(){
  if(crosshairEl && document.body.contains(crosshairEl)) return crosshairEl;

  crosshairEl = document.createElement('div');
  crosshairEl.className = 'chart-crosshair';
  crosshairEl.style.cssText = [
    'position:fixed',
    'width:1.5px',
    'background:linear-gradient(to bottom, transparent, #10b981, transparent)',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity .1s',
    'z-index:9999'
  ].join(';');

  document.body.appendChild(crosshairEl);
  return crosshairEl;
}

/* ============================================================
   FORMAT TOOLTIP CONTENT
============================================================ */
function formatTooltipContent(point, formatter){
  const priceText = formatter
    ? formatter(point.value)
    : (window.U ? window.U.num(point.value, 0) : String(point.value));

  let dateText = '';

  // اولویت: تاریخ شمسی
  if(point.pd){
    dateText = point.pd;
  } else if(point.gd){
    // تبدیل میلادی به شمسی
    try {
      const d = new Date(point.gd);
      if(!isNaN(d.getTime())){
        dateText = d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } else {
        dateText = point.gd;
      }
    } catch(e){
      dateText = point.gd;
    }
  } else if(point.t){
    // از timestamp
    try {
      const d = new Date(point.t);
      dateText = d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch(e){}
  }

  let html = '';
  if(dateText){
    html += '<div style="font-size:10px;opacity:.75;margin-bottom:4px;direction:rtl">' + dateText + '</div>';
  }
  html += '<div style="font-size:14px;font-weight:900;direction:ltr;text-align:center">' + priceText + '</div>';

  return html;
}

/* ============================================================
   DRAW LINE — رسم نمودار اصلی
============================================================ */
function drawLine(canvas, data, opts){
  opts = opts || {};

  const s = setup(canvas);
  if(!s || !data || data.length < 2) return;

  const ctx = s.ctx;
  const w = s.w;
  const h = s.h;

  const pad = opts.padding != null ? opts.padding : 20;
  const padTop = opts.paddingTop != null ? opts.paddingTop : 30;

  /* ─── استخراج قیمت‌ها (پشتیبانی از p یا value) ─── */
  const prices = data.map(function(d){
    return d.p != null ? d.p : d.value;
  }).filter(function(p){ return p != null && !isNaN(p); });

  if(prices.length < 2) return;

  /* ─── رنگ بر اساس جهت ─── */
  const up = prices[prices.length - 1] >= prices[0];
  const color = opts.color || (up ? '#10b981' : '#ef4444');

  /* ─── محدوده ─── */
  const max = Math.max.apply(null, prices);
  const min = Math.min.apply(null, prices);
  const range = max - min || 1;

  const chartH = h - pad - padTop;

  /* ─── محاسبه مختصات نقاط ─── */
  const pts = [];
  for(let i = 0; i < data.length; i++){
    const item = data[i];
    const val = item.p != null ? item.p : item.value;
    if(val == null || isNaN(val)) continue;

    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((val - min) / range) * chartH;

    pts.push({
      x: x,
      y: y,
      value: val,
      index: i,
      t: item.t || 0,
      gd: item.gd || '',
      pd: item.pd || ''
    });
  }

  if(pts.length < 2) return;

  /* ─── ذخیره state برای استفاده در redraw ─── */
  const state = {
    canvas: canvas,
    ctx: ctx,
    pts: pts,
    color: color,
    w: w,
    h: h,
    pad: pad,
    padTop: padTop,
    opts: opts,
    min: min,
    range: range,
    chartH: chartH
  };

  /* ─── رسم اولیه ─── */
  renderChart(state, null);

  /* ─── اتصال listener ها ─── */
  attachListeners(state);
}

/* ============================================================
   RENDER CHART — رسم کامل
============================================================ */
function renderChart(state, hoverPoint){
  const ctx = state.ctx;
  const pts = state.pts;
  const color = state.color;
  const w = state.w;
  const h = state.h;
  const opts = state.opts;

  /* ─── پاک کردن ─── */
  ctx.clearRect(0, 0, w, h);

  /* ─── فیل گرادیانت ─── */
  if(opts.fill !== false){
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hexRgba(color, 0.28));
    g.addColorStop(1, hexRgba(color, 0));

    ctx.beginPath();
    for(let i = 0; i < pts.length; i++){
      if(i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }

  /* ─── خط اصلی ─── */
  ctx.beginPath();
  for(let i = 0; i < pts.length; i++){
    if(i === 0) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.lineWidth = opts.lineWidth || 2.5;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  /* ─── نقاط کلیدی ─── */
  const step = Math.max(1, Math.floor(pts.length / 20));

  for(let i = 0; i < pts.length; i++){
    const isKey = i === 0 || i === pts.length - 1 || i % step === 0;
    if(!isKey) continue;

    const p = pts[i];

    // نقطه اصلی
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // حلقه دور
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = hexRgba(color, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ─── نقطه آخر ─── */
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = hexRgba(color, 0.25);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  /* ─── نقطه هاور (اگر وجود دارد) ─── */
  if(hoverPoint){
    // هاله بزرگ
    ctx.beginPath();
    ctx.arc(hoverPoint.x, hoverPoint.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = hexRgba(color, 0.15);
    ctx.fill();

    // نقطه اصلی
    ctx.beginPath();
    ctx.arc(hoverPoint.x, hoverPoint.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // مرکز سفید
    ctx.beginPath();
    ctx.arc(hoverPoint.x, hoverPoint.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // خط عمودی از نقطه تا پایین
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(hoverPoint.x, hoverPoint.y + 8);
    ctx.lineTo(hoverPoint.x, h - state.pad);
    ctx.strokeStyle = hexRgba(color, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/* ============================================================
   FIND NEAREST POINT
============================================================ */
function findNearest(pts, mx){
  let nearest = null;
  let minDist = Infinity;

  for(let i = 0; i < pts.length; i++){
    const d = Math.abs(pts[i].x - mx);
    if(d < minDist){
      minDist = d;
      nearest = pts[i];
    }
  }

  // حساسیت ۴۰ پیکسل
  if(minDist < 40) return nearest;
  return null;
}

/* ============================================================
   ATTACH LISTENERS — Mouse + Touch
============================================================ */
function attachListeners(state){
  const canvas = state.canvas;

  // پاک کردن listener های قبلی
  if(canvas._chartHandlers){
    const h = canvas._chartHandlers;
    canvas.removeEventListener('mousemove', h.onMouseMove);
    canvas.removeEventListener('mouseleave', h.onMouseLeave);
    canvas.removeEventListener('touchstart', h.onTouchStart);
    canvas.removeEventListener('touchmove', h.onTouchMove);
    canvas.removeEventListener('touchend', h.onTouchEnd);
  }

  const tip = getTooltip();
  const crosshair = getCrosshair();

  function handleMove(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    if(rect.width === 0 || rect.height === 0) return;

    const mx = clientX - rect.left;
    const nearest = findNearest(state.pts, mx);

    if(nearest){
      // ─── Tooltip ───
      tip.innerHTML = formatTooltipContent(nearest, state.opts.formatter);
      tip.style.opacity = '1';

      // موقعیت Tooltip
      const tipRect = tip.getBoundingClientRect();
      let tipX = clientX + 15;
      let tipY = clientY - tipRect.height - 15;

      // جلوگیری از خروج از صفحه
      if(tipX + tipRect.width > window.innerWidth - 10){
        tipX = clientX - tipRect.width - 15;
      }
      if(tipY < 10){
        tipY = clientY + 20;
      }

      tip.style.left = tipX + 'px';
      tip.style.top = tipY + 'px';

      // ─── Crosshair ───
      crosshair.style.opacity = '1';
      crosshair.style.left = (rect.left + nearest.x) + 'px';
      crosshair.style.top = rect.top + 'px';
      crosshair.style.height = rect.height + 'px';

      // ─── رسم مجدد با نقطه هاور ───
      renderChart(state, nearest);

    } else {
      tip.style.opacity = '0';
      crosshair.style.opacity = '0';
      renderChart(state, null);
    }
  }

  function handleLeave(){
    tip.style.opacity = '0';
    crosshair.style.opacity = '0';
    renderChart(state, null);
  }

  const onMouseMove = function(e){
    handleMove(e.clientX, e.clientY);
  };

  const onMouseLeave = function(){
    handleLeave();
  };

  const onTouchStart = function(e){
    if(e.touches.length === 0) return;
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  };

  const onTouchMove = function(e){
    if(e.touches.length === 0) return;
    e.preventDefault();
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  };

  const onTouchEnd = function(){
    handleLeave();
  };

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);

  // ذخیره برای پاک کردن در آینده
  canvas._chartHandlers = {
    onMouseMove: onMouseMove,
    onMouseLeave: onMouseLeave,
    onTouchStart: onTouchStart,
    onTouchMove: onTouchMove,
    onTouchEnd: onTouchEnd
  };
}

/* ============================================================
   DRAW COMPARE — مقایسه دو نماد
============================================================ */
function drawCompare(canvas, A, B){
  const s = setup(canvas);
  if(!s) return;

  // پشتیبانی از آرایه ساده یا آرایه اشیاء
  const extractPrices = function(arr){
    if(!arr || !arr.length) return [];
    return arr.map(function(item){
      if(typeof item === 'number') return item;
      return item.p != null ? item.p : item.value;
    }).filter(function(p){ return p != null && !isNaN(p); });
  };

  const pricesA = extractPrices(A);
  const pricesB = extractPrices(B);

  if(pricesA.length < 2 || pricesB.length < 2) return;

  const ctx = s.ctx;
  const w = s.w;
  const h = s.h;
  const pad = 20;

  const norm = function(arr){
    const base = arr[0] || 1;
    return arr.map(function(v){ return (v / base) * 100; });
  };

  const nA = norm(pricesA);
  const nB = norm(pricesB);
  const all = nA.concat(nB);

  const max = Math.max.apply(null, all);
  const min = Math.min.apply(null, all);
  const range = max - min || 1;

  function stroke(data, color){
    const pts = data.map(function(v, i){
      return {
        x: pad + (i / (data.length - 1)) * (w - pad * 2),
        y: h - pad - ((v - min) / range) * (h - pad * 2)
      };
    });

    // فیل
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hexRgba(color, 0.15));
    g.addColorStop(1, hexRgba(color, 0));

    ctx.beginPath();
    for(let i = 0; i < pts.length; i++){
      if(i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, h);
    ctx.lineTo(pts[0].x, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // خط
    ctx.beginPath();
    for(let i = 0; i < pts.length; i++){
      if(i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  stroke(nA, '#10b981');
  stroke(nB, '#6366f1');
}

/* ============================================================
   CLEANUP — پاک کردن Tooltip و Crosshair
============================================================ */
function cleanup(){
  if(tooltipEl && tooltipEl.parentNode){
    tooltipEl.parentNode.removeChild(tooltipEl);
    tooltipEl = null;
  }
  if(crosshairEl && crosshairEl.parentNode){
    crosshairEl.parentNode.removeChild(crosshairEl);
    crosshairEl = null;
  }
  activeCanvas = null;
}

/* ============================================================
   EXPORT
============================================================ */
return {
  drawLine: drawLine,
  drawCompare: drawCompare,
  cleanup: cleanup
};

})();
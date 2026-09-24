/**
 * قیمتو 5.6 — CHARTS
 * ✅ پشتیبانی از رنگ سفارشی (سبز/قرمز بر اساس جهت)
 * ✅ نمودار خطی + مقایسه
 */
window.Charts = (function(){
'use strict';

/* ============================================================
   SETUP CANVAS
============================================================ */
function setup(canvas){
  if(!canvas) return null;
  const r = canvas.getBoundingClientRect();
  if(!r.width || !r.height) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = r.width, h = r.height;

  if(canvas.width !== w*dpr || canvas.height !== h*dpr){
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function hexRgba(hex, a){
  const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}

/* ============================================================
   DRAW LINE — با رنگ سفارشی
============================================================ */
function drawLine(canvas, data, opts={}){
  const s = setup(canvas);
  if(!s || !data || data.length < 2) return;

  const { ctx, w, h } = s;
  const pad = opts.padding || 14;
  
  // تعیین رنگ: اگه opts.color داده شده، از اون استفاده کن
  // وگرنه بر اساس جهت (first vs last)
  const up = data[data.length-1] >= data[0];
  const color = opts.color || (up ? '#10b981' : '#ef4444');

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v,i) => ({
    x: pad + (i/(data.length-1)) * (w - pad*2),
    y: h - pad - ((v-min)/range) * (h - pad*2)
  }));

  // فیل زیر نمودار
  if(opts.fill !== false){
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, hexRgba(color, 0.28));
    g.addColorStop(1, hexRgba(color, 0));
    ctx.beginPath();
    pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }

  // خط اصلی
  ctx.beginPath();
  pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  ctx.lineWidth = opts.lineWidth || 2.5;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // نقطه آخر
  if(opts.dot !== false){
    const last = pts[pts.length-1];
    // هاله
    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI*2);
    ctx.fillStyle = hexRgba(color, 0.25);
    ctx.fill();
    // نقطه اصلی
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/* ============================================================
   DRAW COMPARE — مقایسه دو نماد
============================================================ */
function drawCompare(canvas, A, B){
  const s = setup(canvas);
  if(!s || !A.length || !B.length) return;

  const { ctx, w, h } = s;
  const pad = 20;

  const norm = arr => arr.map(v => (v/arr[0]) * 100);
  const nA = norm(A), nB = norm(B);
  const all = nA.concat(nB);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;

  function stroke(data, color){
    const pts = data.map((v,i) => ({
      x: pad + (i/(data.length-1)) * (w - pad*2),
      y: h - pad - ((v-min)/range) * (h - pad*2)
    }));

    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, hexRgba(color, 0.15));
    g.addColorStop(1, hexRgba(color, 0));
    ctx.beginPath();
    pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  stroke(nA, '#10b981');
  stroke(nB, '#6366f1');
}

/* ============================================================
   MINI SPARKLINE (برای کارت‌ها)
============================================================ */
function drawSparkline(canvas, data, up){
  const s = setup(canvas);
  if(!s || !data || data.length < 2) return;

  const { ctx, w, h } = s;
  const pad = 2;
  const color = up ? '#10b981' : '#ef4444';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v,i) => ({
    x: pad + (i/(data.length-1)) * (w - pad*2),
    y: h - pad - ((v-min)/range) * (h - pad*2)
  }));

  ctx.beginPath();
  pts.forEach((p,i) => i === 0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

return { drawLine, drawCompare, drawSparkline };
})();
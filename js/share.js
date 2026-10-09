/**
 * قیمتو 8.2 — SHARE
 * ✅ مودال تمام‌صفحه
 * ✅ سه قالب: Classic / Poster / Overlay
 * ✅ ذخیره تصویر با modern-screenshot (رفع مشکل فارسی)
 * ✅ Web Share API
 * ✅ Fallback به html2canvas اگر modern-screenshot لود نشد
 */
window.Share = (function(){
'use strict';

let _modalEl = null;
let _currentAsset = null;
let _currentCar = null;
let _currentTab = 'classic';

/* ═══════════════ HELPERS ═══════════════ */
function esc(str){
  if(str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtNum(num, dec){
  if(num == null || isNaN(num)) return '—';
  dec = dec || 0;
  const fixed = Number(num).toFixed(dec);
  const parts = fixed.split('.');
  const sign = parts[0].startsWith('-') ? '-' : '';
  const intPart = parts[0].replace('-', '');
  const decPart = parts[1];
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let r = sign + withCommas;
  if(decPart) r += '.' + decPart;
  return r.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function unitLabel(){
  const u = (window.CFG && window.CFG.get('currency')) || 'toman';
  return u === 'toman' ? 'تومان' : 'ریال';
}

function baseToUser(v){
  if(v == null || isNaN(v)) return null;
  const u = (window.CFG && window.CFG.get('currency')) || 'toman';
  return u === 'toman' ? v / 10 : v;
}

function formatPrice(asset, rialValue){
  if(rialValue == null || isNaN(rialValue)) return '—';
  if(asset && asset.ptype === 'usd'){
    const dec = asset.dec != null ? asset.dec : 2;
    return '$' + fmtNum(rialValue, dec);
  }
  const val = baseToUser(rialValue);
  const abs = Math.abs(val);
  const d = abs < 10 ? 4 : (abs < 1000 ? 2 : 0);
  return fmtNum(val, d);
}

function priceUnitLabel(asset){
  if(!asset) return '';
  if(asset.ptype === 'usd') return asset.unit ? '$/' + asset.unit : '$';
  return asset.unit ? unitLabel() + '/' + asset.unit : unitLabel();
}

function now(){
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear() +
         ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function todayDate(){
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + '/' + d.getFullYear();
}

function assetIconHTML(asset){
  if(window.Icons && window.Icons.assetSVG) return window.Icons.assetSVG(asset);
  return '';
}

function getChangeInfo(asset){
  const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
  const cp = live && live.changePercent != null ? live.changePercent : 0;
  const up = cp >= 0;
  const cls = cp === 0 ? 'neutral' : (up ? 'up' : 'down');
  const text = cp === 0
    ? 'بدون تغییر'
    : (up ? '▲ ' : '▼ ') + Math.abs(cp).toFixed(2) + '٪';
  return { cp, up, cls, text };
}

/* ═══════════════ MODAL ═══════════════ */
function buildModal(){
  if(_modalEl) return;

  _modalEl = document.createElement('div');
  _modalEl.className = 'share-modal';
  _modalEl.setAttribute('role', 'dialog');
  _modalEl.setAttribute('aria-modal', 'true');
  _modalEl.innerHTML = `
    <div class="share-header">
      <button type="button" class="share-header-btn" data-share-close aria-label="بستن">
        ${window.Icons.get('close')}
      </button>
      <span class="share-header-title">اشتراک‌گذاری</span>
      <div style="width:38px"></div>
    </div>

    <div class="share-preview-area">
      <div class="share-card-wrap" id="share-card-wrap">
        <div class="share-card classic" id="share-card"></div>
      </div>
    </div>

    <div class="share-tabs">
      <button type="button" class="share-tab active" data-share-tab="classic">
        <div class="share-tab-preview">
          <div class="mini">
            <div style="display:flex;justify-content:space-between">
              <div style="width:10px;height:10px;border-radius:50%;background:#c8974a"></div>
              <div style="text-align:right">
                <div class="mini-name">طلای ۱۸</div>
                <div style="font-size:4px;color:#888">GOLD18</div>
              </div>
            </div>
            <div>
              <div style="font-size:5px;color:#10b981">▲ ۱٪</div>
              <div class="mini-price">۲۵,۳۷۰,۰۰۰</div>
            </div>
          </div>
        </div>
        <span class="share-tab-label">کلاسیک</span>
      </button>

      <button type="button" class="share-tab" data-share-tab="poster">
        <div class="share-tab-preview">
          <div class="mini" style="background:#0a0a0a">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
              <div style="width:8px;height:8px;border-radius:50%;background:#c8974a"></div>
              <div class="mini-name">GOLD18</div>
            </div>
            <div class="mini-price" style="font-size:12px">۲۵,۳۷۰,۰۰۰</div>
            <div style="font-size:5px;color:#10b981">▲ ۱٪</div>
          </div>
        </div>
        <span class="share-tab-label">پوستر</span>
      </button>

      <button type="button" class="share-tab" data-share-tab="overlay">
        <div class="share-tab-preview" style="background:#101c18">
          <div class="mini" style="background:linear-gradient(180deg,rgba(16,28,24,0) 0%,#101c18 100%)">
            <div style="margin-top:auto">
              <div class="mini-name" style="font-size:7px">GOLD18</div>
              <div class="mini-price" style="font-size:11px">۲۵,۳۷۰,۰۰۰</div>
            </div>
          </div>
        </div>
        <span class="share-tab-label">اورلی</span>
      </button>
    </div>

    <div class="share-actions">
      <button type="button" class="share-btn outline" data-share-save>
        ${window.Icons.get('download')}
        ذخیره
      </button>
      <button type="button" class="share-btn solid" data-share-send>
        ${window.Icons.get('external')}
        ارسال
      </button>
    </div>
  `;

  document.body.appendChild(_modalEl);

  _modalEl.querySelector('[data-share-close]')
    .addEventListener('click', close);

  _modalEl.querySelectorAll('[data-share-tab]').forEach(btn => {
    btn.addEventListener('click', () => selectTab(btn.dataset.shareTab, btn));
  });

  _modalEl.querySelector('[data-share-save]')
    .addEventListener('click', saveToGallery);

  _modalEl.querySelector('[data-share-send]')
    .addEventListener('click', shareNative);

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && _modalEl && _modalEl.classList.contains('is-open')){
      close();
    }
  });
}

/* ═══════════════ OPEN / CLOSE ═══════════════ */
function open(asset){
  if(!asset) return;
  _currentAsset = asset;
  _currentCar = null;
  _currentTab = 'classic';

  buildModal();

  _modalEl.querySelectorAll('[data-share-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.shareTab === 'classic');
  });

  render();
  _modalEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function openCar(car){
  if(!car) return;
  _currentAsset = null;
  _currentCar = car;
  _currentTab = 'classic';

  buildModal();
  render();
  _modalEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function close(){
  if(!_modalEl) return;
  _modalEl.classList.remove('is-open');
  document.body.style.overflow = '';
  _currentAsset = null;
  _currentCar = null;
}

function selectTab(tab, btn){
  _currentTab = tab;
  _modalEl.querySelectorAll('[data-share-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.shareTab === tab);
  });
  render();
}

/* ═══════════════ RENDER ═══════════════ */
function render(){
  const cardEl = _modalEl.querySelector('#share-card');
  if(!cardEl) return;

  cardEl.className = 'share-card ' + _currentTab;

  if(_currentCar) renderCar(cardEl);
  else renderAsset(cardEl);
}

function renderAsset(cardEl){
  const asset = _currentAsset;
  if(!asset) return;

  const live = window.API && window.API.getById ? window.API.getById(asset.id) : null;
  const price = live && live.price != null ? live.price : null;
  const priceText = price != null ? formatPrice(asset, price) : '—';
  const unit = priceUnitLabel(asset);
  const info = getChangeInfo(asset);
  const iconHTML = assetIconHTML(asset);
  const name = asset.short || asset.name;

  if(_currentTab === 'classic'){
    cardEl.innerHTML = `
      <div class="sc-top">
        <div class="sc-icon">${iconHTML}</div>
        <div class="sc-title">
          <div class="sc-name">${esc(name)}</div>
          <div class="sc-code">${esc(asset.code)}</div>
        </div>
      </div>
      <div class="sc-mid">
        <span class="sc-change ${info.cls}">${info.text}</span>
        <div class="sc-price">${priceText}</div>
        ${unit ? `<div class="sc-unit">${esc(unit)}</div>` : ''}
      </div>
      <div class="sc-foot">
        <div class="sc-brand">
          <img src="assets/logo.webp" alt="">
          <span>قیمتو</span>
        </div>
        <span class="sc-date">${now()}</span>
      </div>
    `;
  }
  else if(_currentTab === 'poster'){
    const hi = live && live.high != null ? formatPrice(asset, live.high) : priceText;
    const lo = live && live.low != null ? formatPrice(asset, live.low) : priceText;
    cardEl.innerHTML = `
      <div>
        <div class="sc-head">
          <div class="sc-icon">${iconHTML}</div>
          <div>
            <div class="sc-name">${esc(name)}</div>
            <div class="sc-code">${esc(asset.code)}</div>
          </div>
        </div>
        <div class="sc-price">${priceText}</div>
        ${unit ? `<div class="sc-unit">${esc(unit)}</div>` : ''}
        <span class="sc-change ${info.cls}">${info.text}</span>
      </div>
      <div>
        <div class="sc-stats">
          <div>
            <div class="sc-stat-label">بیشترین</div>
            <div class="sc-stat-value">${hi}</div>
          </div>
          <div>
            <div class="sc-stat-label">کمترین</div>
            <div class="sc-stat-value">${lo}</div>
          </div>
        </div>
        <div class="sc-foot">
          <div class="sc-brand">
            <img src="assets/logo.webp" alt="">
            <span>قیمتو</span>
          </div>
          <span class="sc-date">${todayDate()}</span>
        </div>
      </div>
    `;
  }
  else if(_currentTab === 'overlay'){
    const hi = live && live.high != null ? formatPrice(asset, live.high) : priceText;
    const lo = live && live.low != null ? formatPrice(asset, live.low) : priceText;
    cardEl.innerHTML = `
      <div class="sc-bg"></div>
      <div class="sc-icon-bg">${iconHTML}</div>
      <div class="sc-content">
        <div class="sc-code">${esc(asset.code)}</div>
        <div class="sc-name">${esc(name)}</div>
        <div class="sc-price">${priceText}</div>
        ${unit ? `<div class="sc-unit">${esc(unit)}</div>` : ''}
        <span class="sc-change ${info.cls}">${info.text}</span>
        <div class="sc-stats">
          <div>
            <div class="sc-stat-label">بیشترین</div>
            <div class="sc-stat-value">${hi}</div>
          </div>
          <div>
            <div class="sc-stat-label">کمترین</div>
            <div class="sc-stat-value">${lo}</div>
          </div>
          <div>
            <div class="sc-stat-label">واحد</div>
            <div class="sc-stat-value">${esc(asset.unit || '—')}</div>
          </div>
        </div>
        <div class="sc-foot">
          <div class="sc-brand">
            <img src="assets/logo.webp" alt="">
            <span>قیمتو</span>
          </div>
          <span class="sc-date">${todayDate()}</span>
        </div>
      </div>
    `;
  }
}

function renderCar(cardEl){
  const car = _currentCar;
  if(!car) return;

  const priceMarket = car.priceMarket != null ? formatPrice({ptype:'rial'}, car.priceMarket) : '—';
  const priceFactory = car.priceFactory != null ? formatPrice({ptype:'rial'}, car.priceFactory) : '—';
  const cp = car.changePercent || 0;
  const cls = cp === 0 ? 'neutral' : (cp > 0 ? 'up' : 'down');
  const text = cp === 0 ? 'بدون تغییر' : (cp > 0 ? '▲ ' : '▼ ') + Math.abs(cp).toFixed(2) + '٪';

  if(_currentTab === 'classic'){
    cardEl.innerHTML = `
      <div class="sc-top">
        <div class="sc-icon">${window.Icons.get('car')}</div>
        <div class="sc-title">
          <div class="sc-name">${esc(car.name)}</div>
          <div class="sc-code">${esc(car.category || '')}</div>
        </div>
      </div>
      <div class="sc-mid">
        <span class="sc-change ${cls}">${text}</span>
        <div class="sc-price" style="font-size:26px">${priceMarket}</div>
        <div class="sc-unit">بازار — تومان</div>
      </div>
      <div class="sc-foot">
        <div class="sc-brand">
          <img src="assets/logo.webp" alt="">
          <span>قیمتو</span>
        </div>
        <span class="sc-date">${now()}</span>
      </div>
    `;
  }
  else if(_currentTab === 'poster'){
    cardEl.innerHTML = `
      <div>
        <div class="sc-head">
          <div class="sc-icon">${window.Icons.get('car')}</div>
          <div>
            <div class="sc-name">${esc(car.name)}</div>
            <div class="sc-code">${esc(car.category || '')}</div>
          </div>
        </div>
        <div class="sc-price" style="font-size:28px">${priceMarket}</div>
        <div class="sc-unit">قیمت بازار — تومان</div>
        <span class="sc-change ${cls}">${text}</span>
      </div>
      <div>
        <div class="sc-stats">
          <div>
            <div class="sc-stat-label">کارخانه</div>
            <div class="sc-stat-value">${priceFactory}</div>
          </div>
          <div>
            <div class="sc-stat-label">بازار</div>
            <div class="sc-stat-value">${priceMarket}</div>
          </div>
        </div>
        <div class="sc-foot">
          <div class="sc-brand">
            <img src="assets/logo.webp" alt="">
            <span>قیمتو</span>
          </div>
          <span class="sc-date">${todayDate()}</span>
        </div>
      </div>
    `;
  }
  else if(_currentTab === 'overlay'){
    cardEl.innerHTML = `
      <div class="sc-bg"></div>
      <div class="sc-icon-bg">${window.Icons.get('car')}</div>
      <div class="sc-content">
        <div class="sc-code">${esc(car.category || '')}</div>
        <div class="sc-name">${esc(car.name)}</div>
        <div class="sc-price" style="font-size:28px">${priceMarket}</div>
        <div class="sc-unit">قیمت بازار</div>
        <span class="sc-change ${cls}">${text}</span>
        <div class="sc-stats">
          <div>
            <div class="sc-stat-label">کارخانه</div>
            <div class="sc-stat-value">${priceFactory}</div>
          </div>
          <div>
            <div class="sc-stat-label">بازار</div>
            <div class="sc-stat-value">${priceMarket}</div>
          </div>
          <div>
            <div class="sc-stat-label">وضعیت</div>
            <div class="sc-stat-value">${esc(car.status || '—')}</div>
          </div>
        </div>
        <div class="sc-foot">
          <div class="sc-brand">
            <img src="assets/logo.webp" alt="">
            <span>قیمتو</span>
          </div>
          <span class="sc-date">${todayDate()}</span>
        </div>
      </div>
    `;
  }
}

/* ═══════════════ SCREENSHOT — modern-screenshot ═══════════════ */
function ensureScreenshotLib(){
  return new Promise((resolve, reject) => {
    // 1. اگر modern-screenshot لود شده
    if(window.modernScreenshot){
      return resolve(window.modernScreenshot);
    }

    // 2. تلاش برای لود از CDN
    const tryLoad = (url, onFail) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => {
        if(window.modernScreenshot){
          resolve(window.modernScreenshot);
        } else {
          onFail();
        }
      };
      s.onerror = onFail;
      document.head.appendChild(s);
    };

    // CDN 1: jsDelivr
    tryLoad(
      'https://cdn.jsdelivr.net/npm/modern-screenshot@4.6.1/dist/index.js',
      () => {
        // CDN 2: unpkg
        tryLoad(
          'https://unpkg.com/modern-screenshot@4.6.1/dist/index.js',
          () => reject(new Error('modern-screenshot load failed'))
        );
      }
    );
  });
}

async function captureCard(){
  const cardEl = _modalEl.querySelector('#share-card');
  if(!cardEl) throw new Error('card element not found');

  // صبر برای لود فونت‌ها
  if(document.fonts && document.fonts.ready){
    try { await document.fonts.ready; } catch(e){}
  }

  const bg = _currentTab === 'poster' ? '#0a0a0a' : '#101c18';

  const ms = await ensureScreenshotLib();

  return await ms.domToCanvas(cardEl, {
    scale: 3,
    backgroundColor: bg,
    font: {
      preferredFormat: 'woff',
      timeout: 8000
    }
  });
}

/* ═══════════════ SAVE TO GALLERY ═══════════════ */
async function saveToGallery(){
  try {
    if(document.fonts && document.fonts.ready){
      try { await document.fonts.ready; } catch(e){}
    }

    const canvas = await captureCard();
    const link = document.createElement('a');
    const name = _currentCar ? _currentCar.name : (_currentAsset ? _currentAsset.id : 'card');
    link.download = 'gheymato-' + _currentTab + '-' + name + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    if(window.Cards && window.Cards.showToast){
      window.Cards.showToast('ذخیره شد ✓', 'success');
    }
  } catch(err){
    console.error('[Share] save failed:', err);
    if(window.Cards && window.Cards.showToast){
      window.Cards.showToast('ذخیره نشد — ' + (err.message || ''), 'error');
    }
  }
}

/* ═══════════════ NATIVE SHARE ═══════════════ */
async function shareNative(){
  try {
    if(document.fonts && document.fonts.ready){
      try { await document.fonts.ready; } catch(e){}
    }

    const canvas = await captureCard();

    canvas.toBlob(blob => {
      if(!blob){
        if(window.Cards && window.Cards.showToast){
          window.Cards.showToast('خطا در ساخت تصویر', 'error');
        }
        return;
      }

      const file = new File([blob], 'gheymato.png', { type: 'image/png' });
      const name = _currentCar
        ? _currentCar.name
        : (_currentAsset ? (_currentAsset.short || _currentAsset.name) : 'قیمتو');

      if(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })){
        navigator.share({
          files: [file],
          title: 'قیمتو — ' + name,
          text: 'قیمت ' + name
        }).catch(() => {});
      } else if(navigator.share){
        navigator.share({
          title: 'قیمتو — ' + name,
          text: 'قیمت ' + name
        }).catch(() => {});
      } else {
        if(window.Cards && window.Cards.showToast){
          window.Cards.showToast('اشتراک‌گذاری پشتیبانی نمی‌شود', 'error');
        }
      }
    }, 'image/png');

  } catch(err){
    console.error('[Share] share failed:', err);
    if(window.Cards && window.Cards.showToast){
      window.Cards.showToast('اشتراک‌گذاری نشد', 'error');
    }
  }
}

/* ═══════════════ EXPORT ═══════════════ */
return {
  open,
  openCar,
  close,
  render,
  saveToGallery,
  shareNative
};

})();
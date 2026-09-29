/**
 * شبیه‌سازی boot در Node
 */
const fs = require('fs');

// ═══ محیط مرورگر ═══
global.window = global;
global.document = {
  readyState: 'complete',
  createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => {
    if(id === 'splashScreen') {
      return { classList: { add: () => {} }, parentNode: null };
    }
    return null;
  },
  addEventListener: () => {},
  body: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
  head: { appendChild: () => {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.navigator = { onLine: true };

console.log('═══════════════════════════════════════');
console.log('🧪 شبیه‌سازی boot');
console.log('═══════════════════════════════════════');

// ═══ 1. بارگذاری data.js ═══
try {
  const dataCode = fs.readFileSync('./js/data.js', 'utf8');
  eval(dataCode);
  console.log('\n✅ data.js لود شد');
  console.log('  window.DATA:', typeof window.DATA);
  console.log('  ASSETS:', window.DATA?.ASSETS?.length);
} catch(e) {
  console.log('\n❌ خطا در data.js:', e.message);
  process.exit(1);
}

// ═══ 2. بارگذاری api.js ═══
try {
  const apiCode = fs.readFileSync('./js/api.js', 'utf8');
  eval(apiCode);
  console.log('\n✅ api.js لود شد');
  console.log('  window.API:', typeof window.API);
} catch(e) {
  console.log('\n❌ خطا در api.js:', e.message);
  process.exit(1);
}

// ═══ 3. شبیه‌سازی app.js (فقط قسمت initUIWhenReady) ═══
console.log('\n✅ شروع boot simulation');

function initUIWhenReady(attempts) {
  attempts = attempts || 0;

  console.log('  تلاش #' + attempts + ' — DATA:', 
    window.DATA ? 'موجود' : 'نیست', 
    '| ASSETS:', 
    window.DATA?.ASSETS?.length || 0
  );

  if (window.DATA && window.DATA.ASSETS && window.DATA.ASSETS.length > 0) {
    console.log('\n  ✅ DATA آماده شد در تلاش #' + attempts);
    return true;
  }

  if (attempts < 50) {
    return initUIWhenReady(attempts + 1);
  } else {
    console.log('\n  ❌ DATA آماده نشد بعد از ۵۰ تلاش');
    return false;
  }
}

const result = initUIWhenReady();

console.log('\n═══════════════════════════════════════');
console.log('نتیجه:', result ? '✅ موفق' : '❌ شکست');
console.log('═══════════════════════════════════════');
/**
 * قیمتو 6.0 — CAR SCRAPER v4 (با URL)
 * منبع: iranjib.ir
 * ✅ دریافت همه‌ی گروه‌ها
 * ✅ استخراج URL صفحه‌ی هر آیتم
 * ✅ موازی‌سازی + Retry
 * ✅ ذخیره در فایل جداگانه هر گروه
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CARS_DIR = path.join(DATA_DIR, 'cars');

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  TIMEOUT: 25000,
  RETRIES: 3,
  RETRY_DELAY: 1500,
  DELAY_BETWEEN: 800,
  MAX_CONCURRENT: 2,
  OUTPUT: 'cars.json',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
};

/* ============================================================
   GROUPS
============================================================ */
const GROUPS = [
  {
    key: 'domestic',
    label: 'خودروهای داخلی',
    url: 'https://www.iranjib.ir/showgroup/45/',
    icon: 'car',
    color: 'green',
    enabled: true
  },
  {
    key: 'imported',
    label: 'خودروهای وارداتی',
    url: 'https://www.iranjib.ir/showgroup/46/',
    icon: 'globe',
    color: 'blue',
    enabled: true
  },

];

/* ============================================================
   HELPERS
============================================================ */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function toEnglish(text){
  if(!text) return '';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return String(text)
    .replace(/[۰-۹]/g, d => persian.indexOf(d))
    .replace(/[٠-٩]/g, d => arabic.indexOf(d));
}

function cleanNumber(text){
  if(text == null) return null;
  let s = toEnglish(String(text));
  s = s.replace(/[,\s\u200c\u200f\u200e\u00a0\u202b\u202c]+/g, '').trim();
  s = s.replace(/[^\d.\-]/g, '');
  if(!s || s === '-' || s === '.') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function slugify(name){
  return String(name || '')
    .trim()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60) || 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

function cleanName(name){
  if(!name) return '';
  return String(name)
    .replace(/\s+/g, ' ')
    .replace(/[\u200c\u200f\u200e]+/g, ' ')
    .trim();
}

function ensureUnique(cars){
  const seen = new Set();
  const result = [];
  for(const car of cars){
    let id = car.id;
    let i = 1;
    while(seen.has(id)){
      id = car.id + '-' + i;
      i++;
    }
    seen.add(id);
    car.id = id;
    result.push(car);
  }
  return result;
}

/* ============================================================
   FETCH
============================================================ */
async function fetchWithRetry(url, attempt = 0){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    if(attempt === 0){
      console.log(`    [Fetch] ${url}`);
    } else {
      console.log(`    [Retry ${attempt}] ${url}`);
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });
    clearTimeout(timer);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if(html.length < 500) throw new Error('Response too small');
    return html;

  } catch(err){
    clearTimeout(timer);
    if(attempt < CONFIG.RETRIES){
      const delay = CONFIG.RETRY_DELAY * Math.pow(1.5, attempt);
      console.log(`    ❌ ${err.message} — تلاش مجدد در ${delay}ms`);
      await sleep(delay);
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  }
}

/* ============================================================
   PARSE
============================================================ */
function parseTable(html, groupKey){
  const $ = cheerio.load(html, { decodeEntities: false });
  const items = [];

  $('table.items_table').each((tblIdx, table) => {
    let currentCategory = '';

    $(table).find('tr').each((rowIdx, row) => {
      const $row = $(row);
      const cls = $row.attr('class') || '';

      // ردیف catsection
      if(cls.includes('catsection')){
        const h2 = $row.find('h2').first();
        if(h2.length){
          const catText = h2.text().trim();
          if(catText){
            currentCategory = catText;
          }
        }
        return;
      }

      // ردیف header
      if(cls.includes('header')) return;

      // ردیف expand
      if(cls.includes('expand')) return;
      if(cls.includes('hidden')) return;

      // استخراج سلول‌ها
      const $cells = $row.find('td');
      if($cells.length < 2) return;

      // ستون ۰: نام + URL
      const $nameCell = $cells.eq(0);
      let name = '';
      let pageUrl = null;

      const $a = $nameCell.find('a').first();
      if($a.length){
        name = cleanName($a.text());
        // ═══ استخراج URL ═══
        const href = $a.attr('href');
        if(href){
          if(href.startsWith('http')){
            pageUrl = href;
          } else if(href.startsWith('//')){
            pageUrl = 'https:' + href;
          } else if(href.startsWith('/')){
            pageUrl = 'https://www.iranjib.ir' + href;
          } else if(href !== '#' && !href.startsWith('javascript:')){
            pageUrl = 'https://www.iranjib.ir/' + href;
          }

          // اگر URL صفحه‌ی خود گروه بود، به عنوان URL اصلی نپذیر
          if(pageUrl && pageUrl.includes('/showgroup/') && pageUrl === 'https://www.iranjib.ir/showgroup/45/'){
            pageUrl = null;
          }
        }
      }
      if(!name){
        name = cleanName($nameCell.text());
      }

      if(!name || name.length < 2) return;
      if(/نام خودرو|نام کالا|header/i.test(name)) return;

      // ستون ۱: قیمت اول
      const $cell1 = $cells.eq(1);
      const price1Text = cleanName($cell1.text());
      const price1 = cleanNumber(price1Text);

      // ستون ۲: قیمت دوم
      const $cell2 = $cells.length > 2 ? $cells.eq(2) : null;
      const price2Text = $cell2 ? cleanName($cell2.text()) : '';
      const price2 = price2Text ? cleanNumber(price2Text) : null;

      // ستون ۳: تغییر
      const $cell3 = $cells.length > 3 ? $cells.eq(3) : null;
      let changePercent = null;
      let changeAmount = null;

      if($cell3){
        const changeText = $cell3.text();
        const percentMatch = changeText.match(/\(([^)]*?)%[^)]*?\)/);
        if(percentMatch){
          changePercent = cleanNumber(percentMatch[1]);
        }
        const afterParen = changeText.replace(/\([^)]*\)/g, '');
        changeAmount = cleanNumber(afterParen);
      }

      // وضعیت
      let status = 'available';
      const allText = price1Text + ' ' + price2Text;
      if(/ناموجود/.test(allText)) status = 'unavailable';
      else if(/به\s*زودی/.test(allText)) status = 'coming-soon';
      else if(/توقف\s*تولید/.test(allText)) status = 'discontinued';
      else if(/توقف\s*فروش/.test(allText)) status = 'not-selling';

      // ═══ ساخت آیتم ═══
      const item = {
        id: slugify(name),
        name: name,
        category: currentCategory || groupKey,
        group: groupKey,
        url: pageUrl,                          // ← URL صفحه
        priceMarket: price1,
        priceFactory: price2,
        change: changeAmount,
        changePercent: changePercent,
        status: status,
        rawPriceMarket: price1Text.substring(0, 80),
        rawPriceFactory: price2Text.substring(0, 80)
      };

      if(item.priceMarket == null && item.priceFactory != null){
        item.priceMarket = item.priceFactory;
        item.priceFactory = null;
      }

      items.push(item);
    });
  });

  // fallback
  if(items.length === 0){
    console.log(`    ⚠️ روش ۱ خالی — تلاش روش جایگزین...`);
    $('tr').each((i, row) => {
      const $row = $(row);
      if($row.hasClass('catsection') || $row.hasClass('header') || $row.hasClass('expand')) return;

      const $cells = $row.find('td');
      if($cells.length < 2) return;

      const $nameCell = $cells.eq(0);
      let name = '';
      let pageUrl = null;
      const $a = $nameCell.find('a').first();
      if($a.length){
        name = cleanName($a.text());
        const href = $a.attr('href');
        if(href){
          if(href.startsWith('http')) pageUrl = href;
          else if(href.startsWith('/')) pageUrl = 'https://www.iranjib.ir' + href;
        }
      }
      if(!name) name = cleanName($nameCell.text());
      if(!name || name.length < 2) return;

      const price1Text = cleanName($cells.eq(1).text());
      const price1 = cleanNumber(price1Text);
      const price2Text = $cells.length > 2 ? cleanName($cells.eq(2).text()) : '';
      const price2 = price2Text ? cleanNumber(price2Text) : null;

      let changePercent = null;
      let changeAmount = null;
      if($cells.length > 3){
        const changeText = $cells.eq(3).text();
        const percentMatch = changeText.match(/\(([^)]*?)%[^)]*?\)/);
        if(percentMatch) changePercent = cleanNumber(percentMatch[1]);
        changeAmount = cleanNumber(changeText.replace(/\([^)]*\)/g, ''));
      }

      let status = 'available';
      const allText = price1Text + ' ' + price2Text;
      if(/ناموجود/.test(allText)) status = 'unavailable';
      else if(/به\s*زودی/.test(allText)) status = 'coming-soon';
      else if(/توقف\s*تولید/.test(allText)) status = 'discontinued';

      items.push({
        id: slugify(name),
        name: name,
        category: groupKey,
        group: groupKey,
        url: pageUrl,
        priceMarket: price1,
        priceFactory: price2,
        change: changeAmount,
        changePercent: changePercent,
        status: status,
        rawPriceMarket: price1Text.substring(0, 80),
        rawPriceFactory: price2Text.substring(0, 80)
      });
    });
  }

  return items;
}

/* ============================================================
   LOAD PREVIOUS
============================================================ */
async function loadPrevious(groupKey){
  try {
    const filePath = path.join(CARS_DIR, groupKey + '.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed.items || [];
  } catch(e){
    try {
      const mainPath = path.join(DATA_DIR, CONFIG.OUTPUT);
      const content = await fs.readFile(mainPath, 'utf-8');
      const parsed = JSON.parse(content);
      return (parsed.cars || []).filter(c => c.group === groupKey);
    } catch(e2){
      return [];
    }
  }
}

/* ============================================================
   SCRAPE ONE GROUP
============================================================ */
async function scrapeGroup(group){
  console.log(`\n📁 [${group.key}] ${group.label}`);
  console.log(`   🌐 ${group.url}`);

  const startTime = Date.now();
  let items = [];
  let success = false;
  let error = null;

  try {
    const html = await fetchWithRetry(group.url);
    console.log(`   📥 ${(html.length / 1024).toFixed(1)} KB`);

    items = parseTable(html, group.key);
    const withUrl = items.filter(i => i.url).length;
    console.log(`   📊 ${items.length} آیتم استخراج شد (${withUrl} با URL)`);

    if(items.length > 0) success = true;

  } catch(err){
    error = err.message;
    console.error(`   ❌ ${err.message}`);
  }

  if(!success){
    console.log(`   📦 تلاش برای استفاده از داده قبلی...`);
    const prevItems = await loadPrevious(group.key);
    if(prevItems.length > 0){
      items = prevItems.map(i => ({ ...i, stale: true }));
      console.log(`   ✅ ${items.length} آیتم از داده قبلی`);
      success = true;
    } else {
      console.log(`   ⚠️ داده قبلی موجود نیست`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  if(items.length > 0){
    const groupFile = path.join(CARS_DIR, group.key + '.json');
    const groupData = {
      group: group.key,
      label: group.label,
      url: group.url,
      updated: new Date().toISOString(),
      updatedTehran: new Date().toLocaleString('fa-IR'),
      count: items.length,
      withUrl: items.filter(i => i.url).length,
      error: error,
      items: items
    };
    await fs.writeFile(groupFile, JSON.stringify(groupData, null, 2), 'utf-8');
    console.log(`   💾 ذخیره شد در ${group.key}.json`);
  }

  return {
    group: group.key,
    label: group.label,
    url: group.url,
    icon: group.icon,
    color: group.color,
    count: items.length,
    withUrl: items.filter(i => i.url).length,
    success: success,
    error: error,
    duration: parseFloat(duration),
    items: items
  };
}

/* ============================================================
   MAIN
============================================================ */
async function main(){
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════');
  console.log('🚗 CAR SCRAPER v4 — iranjib.ir (با URL)');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`📊 ${GROUPS.filter(g => g.enabled).length} گروه`);
  console.log('═══════════════════════════════════════════════');

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CARS_DIR, { recursive: true });

  const enabledGroups = GROUPS.filter(g => g.enabled);
  const results = [];

  for(let i = 0; i < enabledGroups.length; i += CONFIG.MAX_CONCURRENT){
    const chunk = enabledGroups.slice(i, i + CONFIG.MAX_CONCURRENT);
    const chunkResults = await Promise.all(chunk.map(g => scrapeGroup(g)));
    results.push(...chunkResults);
    if(i + CONFIG.MAX_CONCURRENT < enabledGroups.length){
      await sleep(CONFIG.DELAY_BETWEEN);
    }
  }

  const allItems = [];
  for(const result of results){
    allItems.push(...result.items);
  }

  const uniqueItems = ensureUnique(allItems);
  const withUrlCount = uniqueItems.filter(c => c.url).length;

  const stats = {
    total: uniqueItems.length,
    available: uniqueItems.filter(c => c.status === 'available').length,
    unavailable: uniqueItems.filter(c => c.status === 'unavailable').length,
    comingSoon: uniqueItems.filter(c => c.status === 'coming-soon').length,
    discontinued: uniqueItems.filter(c => c.status === 'discontinued' || c.status === 'not-selling').length,
    withUrl: withUrlCount,
    groups: results.length,
    successGroups: results.filter(r => r.success).length
  };

  const byCategory = {};
  const byGroup = {};

  for(const item of uniqueItems){
    const cat = item.category || 'سایر';
    if(!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);

    const grp = item.group || 'unknown';
    if(!byGroup[grp]) byGroup[grp] = [];
    byGroup[grp].push(item);
  }

  const groupsMeta = results.map(r => ({
    key: r.group,
    label: r.label,
    url: r.url,
    icon: r.icon,
    color: r.color,
    count: r.count,
    withUrl: r.withUrl,
    success: r.success,
    error: r.error,
    duration: r.duration
  }));

  const result = {
    updated: new Date().toISOString(),
    updatedTehran: new Date().toLocaleString('fa-IR'),
    source: 'iranjib.ir',
    stats: stats,
    groups: groupsMeta,
    categories: Object.keys(byCategory),
    categoryCount: Object.keys(byCategory).length,
    cars: uniqueItems,
    byCategory: byCategory,
    byGroup: byGroup
  };

  const mainFile = path.join(DATA_DIR, CONFIG.OUTPUT);
  await fs.writeFile(mainFile, JSON.stringify(result, null, 2), 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════');
  console.log(`✅ پایان در ${duration} ثانیه`);
  console.log(`📊 ${stats.total} آیتم یکتا`);
  console.log(`   🔗 با URL: ${stats.withUrl} (${((stats.withUrl / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ✅ موجود: ${stats.available}`);
  console.log(`   ⏳ به زودی: ${stats.comingSoon}`);
  console.log(`   ❌ ناموجود: ${stats.unavailable}`);
  console.log(`   🛑 توقف: ${stats.discontinued}`);
  console.log('');
  console.log(`📁 گروه‌ها (${stats.successGroups}/${stats.groups}):`);
  for(const g of groupsMeta){
    const icon = g.success ? '✅' : '❌';
    const errMsg = g.error ? ` — ${g.error}` : '';
    console.log(`   ${icon} ${g.label}: ${g.count} آیتم (${g.withUrl} با URL)${errMsg}`);
  }
  console.log('═══════════════════════════════════════════════');

  if(uniqueItems.length === 0){
    console.error('❌ هیچ آیتمی استخراج نشد!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ FATAL:', err);
  process.exit(1);
});
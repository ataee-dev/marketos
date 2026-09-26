/**
 * قیمتو 6.0 — CAR IMAGES SCRAPER v2
 * ✅ دانلود تصویر هر خودرو از iranjib.ir
 * ✅ ذخیره با نام خودرو
 * ✅ پشتیبانی از lazy-load (data-src)
 * ✅ استخراج تصویر از meta tags
 * ✅ موازی‌سازی + Retry
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const IMAGES_DIR = path.join(ROOT, 'assets', 'cars');

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  TIMEOUT: 20000,
  RETRIES: 2,
  RETRY_DELAY: 1000,
  DELAY_BETWEEN: 300,
  MAX_CONCURRENT: 4,
  CARS_JSON: path.join(DATA_DIR, 'cars.json'),
  IMAGES_DIR: IMAGES_DIR,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  SKIP_EXISTING: true,
  MAX_IMAGES: 0,          // 0 = همه
  GROUPS_FILTER: ['domestic'],  // فقط داخلی‌ها را دانلود کن (خالی = همه)
  MIN_FILE_SIZE: 2000     // حداقل حجم فایل (بایت)
};

/* ============================================================
   HELPERS
============================================================ */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function cleanName(name){
  if(!name) return 'unknown';
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/[\u200c\u200f\u200e\u00a0]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'unknown';
}

function getExtension(url, contentType){
  const urlMatch = url.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$|#)/i);
  if(urlMatch) return urlMatch[1].toLowerCase();

  if(contentType){
    if(contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if(contentType.includes('png')) return 'png';
    if(contentType.includes('webp')) return 'webp';
    if(contentType.includes('gif')) return 'gif';
    if(contentType.includes('avif')) return 'avif';
    if(contentType.includes('svg')) return 'svg';
  }
  return 'jpg';
}

function ensureAbsoluteUrl(src, baseUrl){
  if(!src) return null;
  src = String(src).trim();
  if(src.startsWith('data:')) return null;
  if(src.startsWith('http://') || src.startsWith('https://')) return src;
  if(src.startsWith('//')) return 'https:' + src;
  try { return new URL(src, baseUrl).href; } catch(e){ return null; }
}

/* ============================================================
   FETCH HTML
============================================================ */
async function fetchHTML(url, attempt = 0){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.5'
      }
    });
    clearTimeout(timer);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch(err){
    clearTimeout(timer);
    if(attempt < CONFIG.RETRIES){
      await sleep(CONFIG.RETRY_DELAY * (attempt + 1));
      return fetchHTML(url, attempt + 1);
    }
    throw err;
  }
}

/* ============================================================
   FETCH IMAGE
============================================================ */
async function fetchImage(url, attempt = 0){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.5',
        'Referer': 'https://www.iranjib.ir/'
      }
    });
    clearTimeout(timer);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if(buffer.length < 500) throw new Error('تصویر خیلی کوچک');
    return {
      buffer,
      contentType: res.headers.get('content-type') || 'image/jpeg',
      size: buffer.length
    };
  } catch(err){
    clearTimeout(timer);
    if(attempt < CONFIG.RETRIES){
      await sleep(CONFIG.RETRY_DELAY * (attempt + 1));
      return fetchImage(url, attempt + 1);
    }
    throw err;
  }
}

/* ============================================================
   EXTRACT IMAGE URL — چند روش
============================================================ */
function extractImageUrl(html, pageUrl){
  const $ = cheerio.load(html, { decodeEntities: false });

  // ═══ روش ۱: og:image (بهترین) ═══
  const ogImage = $('meta[property="og:image"]').attr('content');
  if(ogImage){
    const abs = ensureAbsoluteUrl(ogImage, pageUrl);
    if(abs) return abs;
  }

  // ═══ روش ۲: twitter:image ═══
  const twImage = $('meta[name="twitter:image"]').attr('content');
  if(twImage){
    const abs = ensureAbsoluteUrl(twImage, pageUrl);
    if(abs) return abs;
  }

  // ═══ روش ۳: itemprop="image" ═══
  const itempropContent = $('[itemprop="image"]').attr('content');
  if(itempropContent){
    const abs = ensureAbsoluteUrl(itempropContent, pageUrl);
    if(abs) return abs;
  }
  const itempropSrc = $('[itemprop="image"]').attr('src');
  if(itempropSrc){
    const abs = ensureAbsoluteUrl(itempropSrc, pageUrl);
    if(abs) return abs;
  }

  // ═══ روش ۴: schema.org JSON-LD ═══
  const jsonLd = $('script[type="application/ld+json"]').toArray();
  for(const script of jsonLd){
    try {
      const data = JSON.parse($(script).text());
      if(data.image){
        const img = Array.isArray(data.image) ? data.image[0] : data.image;
        const abs = ensureAbsoluteUrl(img, pageUrl);
        if(abs) return abs;
      }
    } catch(e){}
  }

  // ═══ روش ۵: تصویر اصلی مقاله ═══
  const mainSelectors = [
    '.article-image img',
    '.news-image img',
    '.main-image img',
    '.post-image img',
    '.shownews img',
    '.news-body img',
    'article img',
    '.content img',
    '#content img'
  ];

  for(const sel of mainSelectors){
    const $imgs = $(sel);
    for(const img of $imgs.toArray()){
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-original');
      if(src){
        const abs = ensureAbsoluteUrl(src, pageUrl);
        if(abs && !isBadImage(abs)) return abs;
      }
    }
  }

  // ═══ روش ۶: اولین تصویر بزرگ ═══
  const allImgs = $('img').toArray();
  for(const img of allImgs){
    const src = $(img).attr('src') || $(img).attr('data-src');
    if(!src) continue;
    const abs = ensureAbsoluteUrl(src, pageUrl);
    if(abs && !isBadImage(abs)) return abs;
  }

  return null;
}

function isBadImage(url){
  return /logo|icon|avatar|banner|ad-|ads|yektanet|google|analytics|pixel|tracking|thumb|\.svg/i.test(url);
}

/* ============================================================
   DOWNLOAD ONE
============================================================ */
async function downloadCarImage(car){
  const safeName = cleanName(car.name);
  const result = { car: car.name, status: 'unknown', file: null, url: null, size: 0, error: null };

  // چک فایل موجود
  if(CONFIG.SKIP_EXISTING){
    try {
      const files = await fs.readdir(CONFIG.IMAGES_DIR);
      const exists = files.some(f => f.startsWith(safeName + '.'));
      if(exists){ result.status = 'skipped'; return result; }
    } catch(e){}
  }

  // URL صفحه
  const pageUrl = car.url;
  if(!pageUrl){
    result.status = 'no-url';
    result.error = 'URL صفحه موجود نیست';
    return result;
  }

  // دریافت صفحه
  let html;
  try {
    html = await fetchHTML(pageUrl);
  } catch(err){
    result.status = 'page-error';
    result.error = err.message;
    return result;
  }

  // استخراج URL تصویر
  const imageUrl = extractImageUrl(html, pageUrl);
  if(!imageUrl){
    result.status = 'no-image';
    result.error = 'تصویری پیدا نشد';
    return result;
  }

  result.url = imageUrl;

  // دانلود تصویر
  let imageData;
  try {
    imageData = await fetchImage(imageUrl);
  } catch(err){
    result.status = 'download-error';
    result.error = err.message;
    return result;
  }

  // چک حداقل حجم
  if(imageData.size < CONFIG.MIN_FILE_SIZE){
    result.status = 'too-small';
    result.error = `فایل کوچک (${imageData.size} بایت)`;
    return result;
  }

  const ext = getExtension(imageUrl, imageData.contentType);
  const filename = safeName + '.' + ext;
  const filePath = path.join(CONFIG.IMAGES_DIR, filename);

  try {
    await fs.writeFile(filePath, imageData.buffer);
    result.status = 'ok';
    result.file = filename;
    result.size = imageData.size;
  } catch(err){
    result.status = 'save-error';
    result.error = err.message;
  }

  return result;
}

/* ============================================================
   MAIN
============================================================ */
async function main(){
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════');
  console.log('🖼️  CAR IMAGES SCRAPER v2');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════');

  await fs.mkdir(CONFIG.IMAGES_DIR, { recursive: true });

  let carsData;
  try {
    const content = await fs.readFile(CONFIG.CARS_JSON, 'utf-8');
    carsData = JSON.parse(content);
  } catch(err){
    console.error('❌ خطا در خواندن cars.json:', err.message);
    process.exit(1);
  }

  let cars = carsData.cars || [];

  if(!cars.length){
    console.error('❌ هیچ خودرویی در cars.json نیست');
    process.exit(1);
  }

  console.log(`📊 ${cars.length} خودرو در cars.json`);

  // فیلتر گروه
  if(CONFIG.GROUPS_FILTER && CONFIG.GROUPS_FILTER.length > 0){
    cars = cars.filter(c => CONFIG.GROUPS_FILTER.includes(c.group));
    console.log(`🔽 فیلتر گروه: ${CONFIG.GROUPS_FILTER.join(', ')} → ${cars.length} آیتم`);
  }

  // فیلتر URL
  const withUrl = cars.filter(c => c.url);
  console.log(`🔗 ${withUrl.length} خودرو URL دارند`);

  if(!withUrl.length){
    console.error('\n❌ هیچ خودرویی URL ندارد!');
    console.error('   باید اول scraper-cars.js را با نسخه v4 اجرا کنید:');
    console.error('   npm run scrape-cars');
    process.exit(1);
  }

  cars = withUrl;

  if(CONFIG.MAX_IMAGES && cars.length > CONFIG.MAX_IMAGES){
    console.log(`⚠️  محدود کردن به ${CONFIG.MAX_IMAGES} خودرو`);
    cars = cars.slice(0, CONFIG.MAX_IMAGES);
  }

  console.log(`⬇️  در حال دانلود ${cars.length} تصویر...\n`);

  const stats = { total: cars.length, ok: 0, skipped: 0, noImage: 0, noUrl: 0, tooSmall: 0, error: 0, totalSize: 0 };
  const queue = cars.slice();
  const active = new Set();

  async function processOne(car){
    const result = await downloadCarImage(car);
    if(result.status === 'ok'){
      stats.ok++;
      stats.totalSize += result.size;
      console.log(`✅ ${result.car} → ${result.file} (${(result.size / 1024).toFixed(1)} KB)`);
    } else if(result.status === 'skipped'){
      stats.skipped++;
      console.log(`⏭️  ${result.car} → قبلاً دانلود شده`);
    } else if(result.status === 'no-image'){
      stats.noImage++;
      console.log(`⚠️  ${result.car} → تصویری پیدا نشد`);
    } else if(result.status === 'no-url'){
      stats.noUrl++;
      console.log(`⚠️  ${result.car} → URL ندارد`);
    } else if(result.status === 'too-small'){
      stats.tooSmall++;
      console.log(`⚠️  ${result.car} → ${result.error}`);
    } else {
      stats.error++;
      console.log(`❌ ${result.car} → ${result.error}`);
    }
  }

  while(queue.length > 0 || active.size > 0){
    while(queue.length > 0 && active.size < CONFIG.MAX_CONCURRENT){
      const car = queue.shift();
      const promise = processOne(car).then(() => active.delete(promise));
      active.add(promise);
    }
    if(active.size > 0) await Promise.race(active);
    if(queue.length > 0) await sleep(CONFIG.DELAY_BETWEEN);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalSizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);

  console.log('\n═══════════════════════════════════════════════');
  console.log(`✅ پایان در ${duration} ثانیه`);
  console.log(`📊 کل: ${stats.total}`);
  console.log(`   ✅ دانلود شده: ${stats.ok}`);
  console.log(`   ⏭️  رد شده (قبلاً بود): ${stats.skipped}`);
  console.log(`   ⚠️  بدون تصویر: ${stats.noImage}`);
  console.log(`   ⚠️  بدون URL: ${stats.noUrl}`);
  console.log(`   ⚠️  خیلی کوچک: ${stats.tooSmall}`);
  console.log(`   ❌ خطا: ${stats.error}`);
  console.log(`💾 حجم کل: ${totalSizeMB} MB`);
  console.log(`📁 مسیر: ${CONFIG.IMAGES_DIR}`);
  console.log('═══════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ FATAL:', err);
  process.exit(1);
});
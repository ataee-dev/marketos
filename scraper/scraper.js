/**
 * قیمتو 5.3 — TGJU Scraper
 * استخراج داده از TGJU و ذخیره در data/
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYMBOLS, HISTORY_SYMBOLS } from './symbols.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const HISTORY_DIR = path.join(DATA_DIR, 'history');

/* ============================================================
   CONFIG
============================================================ */
const TGJU_ENDPOINTS = [
  'https://call2.tgju.org/ajax.json',
  'https://call.tgju.org/ajax.json',
  'https://call3.tgju.org/ajax.json'
];

const HISTORY_KEEP_DAYS = 30;   // نگهداری ۳۰ روز اخیر
const MAX_POINTS_PER_DAY = 288; // ۲۴ ساعت × ۱۲ (هر ۵ دقیقه)

/* ============================================================
   UTILS
============================================================ */
function cleanNumber(v) {
  if (v == null || v === '') return null;
  const s = String(v).replace(/,/g, '').replace(/\s+/g, '').replace(/\t/g, '').trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalize(key, item) {
  return {
    p: cleanNumber(item.p),
    h: cleanNumber(item.h),
    l: cleanNumber(item.l),
    o: cleanNumber(item.o),
    d: cleanNumber(item.d),
    dp: cleanNumber(item.dp),
    t: item.t || '',
    t_en: item.t_en || '',
    ts: item.ts || ''
  };
}

function today() {
  const now = new Date();
  // تهران = UTC+3:30
  const tehranOffset = 3.5 * 60;
  const tehranTime = new Date(now.getTime() + tehranOffset * 60 * 1000);
  return tehranTime.toISOString().slice(0, 10);
}

/* ============================================================
   FETCH
============================================================ */
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Gheymato-Scraper/5.3)',
        'Accept': 'application/json',
        'Accept-Language': 'fa-IR,fa;q=0.9'
      }
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length < 100) throw new Error('Response too small');
    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function fetchTGJU() {
  let lastError = null;

  for (const endpoint of TGJU_ENDPOINTS) {
    try {
      const url = endpoint + '?_=' + Date.now();
      console.log(`[Fetch] Trying ${endpoint}...`);
      const json = await fetchWithTimeout(url);
      console.log(`[Fetch] ✅ Success from ${endpoint}`);
      return json;
    } catch (err) {
      lastError = err;
      console.warn(`[Fetch] ❌ ${endpoint}: ${err.message}`);
    }
  }

  throw lastError || new Error('All endpoints failed');
}

/* ============================================================
   SAVE FUNCTIONS
============================================================ */
async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

async function saveLatest(json) {
  const current = json.current || {};
  const filtered = {};

  for (const sym of SYMBOLS) {
    if (current[sym]) {
      filtered[sym] = normalize(sym, current[sym]);
    }
  }

  const latest = {
    updated: new Date().toISOString(),
    updatedTehran: new Date().toLocaleString('fa-IR'),
    count: Object.keys(filtered).length,
    symbols: SYMBOLS.length,
    data: filtered
  };

  const filePath = path.join(DATA_DIR, 'latest.json');
  await fs.writeFile(filePath, JSON.stringify(latest, null, 2), 'utf-8');
  console.log(`[Save] ✅ latest.json — ${latest.count}/${latest.symbols} symbols`);

  return latest;
}

async function appendHistory(latest) {
  const date = today();
  const filePath = path.join(HISTORY_DIR, `${date}.json`);

  // خوندن فایل موجود (اگه هست)
  let history;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    history = JSON.parse(content);
  } catch {
    history = {
      date,
      created: new Date().toISOString(),
      symbols: {}
    };
  }

  // timestamp فعلی
  const now = Date.now();

  // اضافه کردن نقاط جدید
  for (const sym of HISTORY_SYMBOLS) {
    if (!latest.data[sym]) continue;
    const item = latest.data[sym];

    if (!history.symbols[sym]) {
      history.symbols[sym] = [];
    }

    // اضافه کردن نقطه جدید
    history.symbols[sym].push({
      t: now,
      p: item.p,
      dp: item.dp || 0
    });

    // محدود کردن تعداد نقاط
    if (history.symbols[sym].length > MAX_POINTS_PER_DAY) {
      history.symbols[sym] = history.symbols[sym].slice(-MAX_POINTS_PER_DAY);
    }
  }

  history.lastUpdate = new Date().toISOString();

  await fs.writeFile(filePath, JSON.stringify(history), 'utf-8');
  console.log(`[Save] ✅ history/${date}.json — ${Object.keys(history.symbols).length} symbols`);
}

async function cleanupOldHistory() {
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const cutoff = Date.now() - (HISTORY_KEEP_DAYS * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const dateStr = file.replace('.json', '');
      const fileDate = new Date(dateStr + 'T00:00:00Z').getTime();

      if (fileDate < cutoff) {
        await fs.unlink(path.join(HISTORY_DIR, file));
        console.log(`[Cleanup] 🗑️ Removed ${file}`);
      }
    }
  } catch (err) {
    console.warn('[Cleanup] ⚠️', err.message);
  }
}

async function saveIndex(latest) {
  // فایل index برای لیست تاریخچه‌ها
  const files = await fs.readdir(HISTORY_DIR);
  const dates = files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()
    .reverse();

  const index = {
    updated: new Date().toISOString(),
    total: dates.length,
    dates,
    symbols: HISTORY_SYMBOLS
  };

  await fs.writeFile(
    path.join(DATA_DIR, 'history-index.json'),
    JSON.stringify(index, null, 2),
    'utf-8'
  );
  console.log(`[Save] ✅ history-index.json — ${dates.length} days`);
}

/* ============================================================
   MAIN
============================================================ */
async function main() {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════');
  console.log('🚀 Gheymato Scraper — Start');
  console.log('═══════════════════════════════════════');

  try {
    // ۱. آماده‌سازی پوشه‌ها
    await ensureDirs();

    // ۲. دریافت داده
    const json = await fetchTGJU();

    if (!json || !json.current) {
      throw new Error('Invalid structure — no current field');
    }

    const totalSymbols = Object.keys(json.current).length;
    console.log(`[Data] 📊 Received ${totalSymbols} symbols from TGJU`);

    // ۳. ذخیره latest.json
    const latest = await saveLatest(json);

    // ۴. اضافه به تاریخچه
    await appendHistory(latest);

    // ۵. پاکسازی تاریخچه قدیمی
    await cleanupOldHistory();

    // ۶. ذخیره index
    await saveIndex(latest);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('═══════════════════════════════════════');
    console.log(`✅ Done in ${duration}s`);
    console.log('═══════════════════════════════════════');

  } catch (err) {
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR:', err.message);
    console.error('═══════════════════════════════════════');
    process.exit(1);
  }
}

main();
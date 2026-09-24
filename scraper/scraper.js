/**
 * قیمتو 5.4 — TGJU Scraper
 * ✅ هر ۵ دقیقه: latest.json (overwrite)
 * ✅ هر ۱۵ دقیقه: history/*.json (دائمی)
 * ❌ بدون temp
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

const CONFIG = {
  HISTORY_INTERVAL: 15,      // هر ۱۵ دقیقه یک نقطه تاریخچه
  MAX_HISTORY_POINTS: 100,   // حداکثر ۱۰۰ نقطه در روز
  HISTORY_KEEP_DAYS: 365     // نگه‌داری ۱ سال
};

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

function normalize(item) {
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

function tehranDate() {
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const t = new Date(now.getTime() + tehranOffset);
  return t.toISOString().slice(0, 10);
}

function tehranTime() {
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const t = new Date(now.getTime() + tehranOffset);
  const hh = String(t.getUTCHours()).padStart(2, '0');
  const mm = String(t.getUTCMinutes()).padStart(2, '0');
  const ss = String(t.getUTCSeconds()).padStart(2, '0');
  return hh + ':' + mm + ':' + ss;
}

/**
 * تشخیص زمان تاریخچه: وقتی دقیقه مضرب ۱۵ باشه (0, 15, 30, 45)
 */
function isHistoryTime() {
  const now = new Date();
  const tehranOffset = 3.5 * 60 * 60 * 1000;
  const t = new Date(now.getTime() + tehranOffset);
  const minutes = t.getUTCMinutes();
  return minutes % 15 <= 2;
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
        'User-Agent': 'Mozilla/5.0 (compatible; Gheymato-Scraper/5.4)',
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
      console.log(`[Fetch] ✅ Success`);
      return json;
    } catch (err) {
      lastError = err;
      console.warn(`[Fetch] ❌ ${endpoint}: ${err.message}`);
    }
  }
  throw lastError || new Error('All endpoints failed');
}

/* ============================================================
   DIRS
============================================================ */
async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

/* ============================================================
   SAVE: latest.json (هر ۵ دقیقه، overwrite)
============================================================ */
async function saveLatest(json) {
  const current = json.current || {};
  const filtered = {};

  for (const sym of SYMBOLS) {
    if (current[sym]) {
      filtered[sym] = normalize(current[sym]);
    }
  }

  const latest = {
    updated: new Date().toISOString(),
    updatedTehran: new Date().toLocaleString('fa-IR'),
    time: tehranTime(),
    count: Object.keys(filtered).length,
    symbols: SYMBOLS.length,
    data: filtered
  };

  const filePath = path.join(DATA_DIR, 'latest.json');
  await fs.writeFile(filePath, JSON.stringify(latest, null, 2), 'utf-8');
  console.log(`[Save] ✅ latest.json — ${latest.count}/${latest.symbols}`);
  return latest;
}

/* ============================================================
   SAVE: history/ (هر ۱۵ دقیقه، دائمی)
============================================================ */
async function appendHistory(latest) {
  const date = tehranDate();
  const filePath = path.join(HISTORY_DIR, `${date}.json`);

  let history;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    history = JSON.parse(content);
  } catch {
    history = {
      date,
      created: new Date().toISOString(),
      interval: '15min',
      symbols: {}
    };
  }

  const now = Date.now();
  let added = 0;

  for (const sym of HISTORY_SYMBOLS) {
    if (!latest.data[sym]) continue;
    const item = latest.data[sym];

    if (!history.symbols[sym]) {
      history.symbols[sym] = [];
    }

    // چک کن آخرین نقطه بیشتر از ۱۲ دقیقه پیش نبوده
    const lastPoint = history.symbols[sym][history.symbols[sym].length - 1];
    if (lastPoint && (now - lastPoint.t) < 12 * 60 * 1000) {
      continue;
    }

    history.symbols[sym].push({
      t: now,
      p: item.p,
      dp: item.dp || 0
    });
    added++;

    if (history.symbols[sym].length > CONFIG.MAX_HISTORY_POINTS) {
      history.symbols[sym] = history.symbols[sym].slice(-CONFIG.MAX_HISTORY_POINTS);
    }
  }

  history.lastUpdate = new Date().toISOString();
  history.lastTime = tehranTime();
  history.totalPoints = Object.keys(history.symbols).reduce(
    (sum, k) => sum + history.symbols[k].length, 0
  );

  await fs.writeFile(filePath, JSON.stringify(history), 'utf-8');
  console.log(`[Save] ✅ history/${date}.json — +${added} points (total: ${history.totalPoints})`);
}

async function cleanupOldHistory() {
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const cutoff = Date.now() - (CONFIG.HISTORY_KEEP_DAYS * 24 * 60 * 60 * 1000);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const dateStr = file.replace('.json', '');
      const fileDate = new Date(dateStr + 'T00:00:00Z').getTime();
      if (fileDate < cutoff) {
        await fs.unlink(path.join(HISTORY_DIR, file));
        console.log(`[Cleanup] 🗑️ ${file}`);
      }
    }
  } catch (err) {
    console.warn('[Cleanup] ⚠️', err.message);
  }
}

/* ============================================================
   SAVE: history-index.json
============================================================ */
async function saveIndex() {
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
    symbols: HISTORY_SYMBOLS,
    interval: '15min',
    maxPointsPerDay: CONFIG.MAX_HISTORY_POINTS
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
  console.log(`🚀 Scraper — ${tehranTime()}`);
  console.log(`📅 History time? ${isHistoryTime() ? '✅ YES' : '❌ NO'}`);
  console.log('═══════════════════════════════════════');

  try {
    await ensureDirs();

    const json = await fetchTGJU();
    if (!json || !json.current) throw new Error('Invalid structure');

    console.log(`[Data] 📊 ${Object.keys(json.current).length} symbols from TGJU`);

    // ۱. ذخیره latest (هر بار)
    const latest = await saveLatest(json);

    // ۲. ذخیره history (فقط در بازه‌های ۱۵ دقیقه)
    if (isHistoryTime()) {
      await appendHistory(latest);
      await cleanupOldHistory();
      await saveIndex();
    } else {
      console.log('[History] ⏭️ Skip (not 15-min interval)');
    }

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
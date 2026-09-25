"""
قیمتو — History Scraper v3 (نهایی)
پارس دقیق بر اساس ترتیب ستون‌های TGJU
"""

import json
import time
import re
from pathlib import Path
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

# ═══ نمادها (قابل تغییر) ═══
SYMBOLS = [
    'geram18', 'geram24', 'mesghal', 'sekeb', 'sekee', 'nim', 'rob',
    'price_dollar_rl', 'price_eur', 'price_gbp', 'price_aed', 'price_try',
    'silver', 'platinum', 'copper',
    'ons', 'crypto-bitcoin', 'crypto-ethereum', 'oil_brent', 'bourse'
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

CONFIG = {
    'DELAY': 1.5,
    'TIMEOUT': 20,
    'MAX_PAGES': 2,
    'OUTPUT': 'data/annual-history.json'
}


def to_english(text):
    if not text:
        return ''
    for p, e in zip('۰۱۲۳۴۵۶۷۸۹', '0123456789'):
        text = text.replace(p, e)
    for a, e in zip('٠١٢٣٤٥٦٧٨٩', '0123456789'):
        text = text.replace(a, e)
    return text


def clean_number(text):
    """تبدیل متن به عدد — حذف کاما، فاصله، علامت‌ها"""
    if not text:
        return None
    text = to_english(str(text))
    # حذف کاراکترهای اضافی
    text = re.sub(r'[,\s\u200c\u200f\u200e\u00a0]+', '', text)
    text = re.sub(r'[▲▼↑↓]', '', text)
    text = re.sub(r'[^\d.\-]', '', text)
    if not text or text == '-' or text == '.':
        return None
    try:
        return float(text)
    except:
        return None


def parse_percentage(text):
    """استخراج درصد با علامت"""
    if not text:
        return None
    text = str(text).strip()
    is_down = any(c in text for c in '▼↓')
    val = clean_number(text)
    if val is None:
        return None
    return -val if is_down else val


def fetch_page(symbol, page=1):
    """دریافت صفحه history"""
    url = f'https://tgju.org/profile/{symbol}/history'
    if page > 1:
        url += f'?page={page}'
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=CONFIG['TIMEOUT'])
        res.raise_for_status()
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        print(f'    ❌ {e}')
        return None


def parse_history(html):
    """
    پارس دقیق جدول — ترتیب ستون‌ها:
    [0] بازگشایی
    [1] کمترین
    [2] بیشترین
    [3] پایانی
    [4] میزان تغییر
    [5] درصد تغییر
    [6] تاریخ میلادی
    [7] تاریخ شمسی
    """
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'lxml')
    
    # پیدا کردن جدول اصلی
    table = None
    for t in soup.find_all('table'):
        rows = t.find_all('tr')
        if len(rows) > 5:
            # چک کن ۸ ستونه باشه
            first_data = None
            for r in rows:
                cells = r.find_all(['td', 'th'])
                if len(cells) == 8:
                    first_data = r
                    break
            if first_data:
                table = t
                break
    
    if not table:
        print('    ⚠️ جدول ۸ ستونی پیدا نشد')
        return []
    
    history = []
    rows = table.find_all('tr')
    
    for row in rows:
        cells = row.find_all(['td', 'th'])
        if len(cells) != 8:
            continue
        
        texts = [c.get_text(strip=True) for c in cells]
        
        # چک کن این ردیف داده هست یا header
        # header: متن‌ها غیرعددی
        # data: یک ستون عدد داره
        
        # تاریخ میلادی (ستون ۶)
        gd = texts[6] if len(texts) > 6 else ''
        gd_en = to_english(gd)
        
        if not re.match(r'^20\d{2}/\d{1,2}/\d{1,2}$', gd_en):
            continue  # header یا ردیف نامعتبر
        
        # تاریخ شمسی (ستون ۷)
        pd = texts[7] if len(texts) > 7 else ''
        
        # ═══ استخراج دقیق بر اساس ترتیب ═══
        o = clean_number(texts[0])   # بازگشایی
        l = clean_number(texts[1])   # کمترین
        h = clean_number(texts[2])   # بیشترین
        p = clean_number(texts[3])   # پایانی
        d_raw = texts[4]              # میزان تغییر (با علامت)
        dp_raw = texts[5]             # درصد تغییر (با علامت)
        
        # جهت تغییر
        d_is_down = any(c in d_raw for c in '▼↓')
        d = clean_number(d_raw)
        if d is not None and d_is_down:
            d = -d
        
        dp = parse_percentage(dp_raw)
        
        history.append({
            'pd': pd,
            'gd': gd,
            'o': o,
            'h': h,
            'l': l,
            'p': p,
            'd': d,
            'dp': dp
        })
    
    return history


def scrape_symbol(symbol):
    print(f'\n📊 {symbol}')
    print('─' * 50)
    
    all_history = []
    seen = set()
    
    for page in range(1, CONFIG['MAX_PAGES'] + 1):
        print(f'  📄 صفحه {page}...', end=' ', flush=True)
        
        html = fetch_page(symbol, page)
        if not html:
            print('❌')
            break
        
        print(f'✅ {len(html)} بایت', end=' — ')
        
        page_data = parse_history(html)
        
        if not page_data:
            print('⚠️ داده‌ای نیست')
            break
        
        added = 0
        for item in page_data:
            key = item.get('gd') or item.get('pd')
            if key and key not in seen:
                seen.add(key)
                all_history.append(item)
                added += 1
        
        print(f'{len(page_data)} ردیف ({added} جدید)')
        
        if added == 0:
            break
        
        time.sleep(CONFIG['DELAY'])
    
    return all_history


def main():
    print('=' * 50)
    print('🚀 TGJU History Scraper v3')
    print('=' * 50)
    print(f'📊 {len(SYMBOLS)} نماد')
    print()
    
    result = {
        'created': datetime.now(timezone.utc).isoformat(),
        'source': 'tgju-history-v3',
        'count': 0,
        'total': len(SYMBOLS),
        'symbols': {}
    }
    
    start = time.time()
    
    for i, symbol in enumerate(SYMBOLS, 1):
        print(f'[{i}/{len(SYMBOLS)}]', end=' ')
        data = scrape_symbol(symbol)
        if data:
            result['symbols'][symbol] = data
            result['count'] += 1
    
    duration = time.time() - start
    
    output = Path(CONFIG['OUTPUT'])
    output.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))
    
    size_kb = output.stat().st_size / 1024
    
    print()
    print('=' * 50)
    print('✅ پایان')
    print('=' * 50)
    print(f'⏱  زمان: {duration:.1f} ثانیه')
    print(f'📊 موفق: {result["count"]}/{result["total"]}')
    print(f'📁 {CONFIG["OUTPUT"]}')
    print(f'📦 {size_kb:.1f} KB')
    print()
    for sym, data in result['symbols'].items():
        print(f'  {sym:25s} → {len(data):4d} ردیف')
    print('=' * 50)


if __name__ == '__main__':
    main()

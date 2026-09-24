/**
 * لیست نمادهای مهم برای ذخیره‌سازی
 * فقط ۶۰ نماد اصلی — برای سبک موندن فایل‌ها
 */

export const SYMBOLS = [
  // طلا و سکه
  'geram18', 'geram24', 'mesghal', 'sekeb', 'sekee',
  'nim', 'rob', 'gerami', 'ons',

  // ارزهای اصلی
  'price_dollar_rl', 'price_eur', 'price_gbp', 'price_aed',
  'price_try', 'price_cny', 'price_jpy', 'price_cad',
  'price_aud', 'price_chf', 'price_rub', 'price_sar',
  'price_kwd', 'price_iqd', 'price_afn',

  // فلزات
  'silver', 'platinum', 'palladium', 'copper', 'aluminium',

  // انرژی
  'oil', 'oil_brent', 'energy_natural_gas',

  // کریپتو
  'crypto-bitcoin', 'crypto-ethereum', 'crypto-tether',
  'crypto-binance-coin', 'crypto-ripple', 'crypto-cardano',
  'crypto-solana', 'crypto-dogecoin', 'crypto-litecoin', 'crypto-polkadot',

  // کالا
  'commodity_us_wheat', 'commodity_corn',
  'commodity_us_sugar_no11', 'commodity_us_coffee_c',

  // شاخص‌ها
  'bourse', 'dow_jones_us', 'nasdaq_us', 's_p_500_us',

  // توکن طلا
  'tether_gold_xaut'
];

/**
 * فقط این نمادها در فایل تاریخچه ذخیره می‌شن
 * (برای سبک موندن)
 */
export const HISTORY_SYMBOLS = [
  'geram18', 'sekeb', 'price_dollar_rl', 'price_eur',
  'ons', 'silver', 'crypto-bitcoin', 'crypto-ethereum',
  'oil_brent', 'bourse'
];
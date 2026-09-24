/**
 * قیمتو 5.4 — Symbols
 * ۱۰۰ نماد مهم TGJU
 */

export const SYMBOLS = [
  // ═══ طلا و سکه (۱۵) ═══
  'geram18', 'geram24', 'gold_17', 'mesghal',
  'sekeb', 'sekee', 'sekeb_real', 'nim', 'rob', 'gerami',
  'ons', 'gold_melted_wholesale', 'gold_melted_transfer',
  'gold_mini_size', 'gold_740k',

  // ═══ ارز (۳۵) ═══
  'price_dollar_rl', 'price_dollar_dt', 'price_dollar_ex',
  'price_eur', 'price_gbp', 'price_aed', 'price_try',
  'price_cny', 'price_jpy', 'price_cad', 'price_aud',
  'price_chf', 'price_rub', 'price_sar', 'price_kwd',
  'price_iqd', 'price_afn', 'price_inr', 'price_pkr',
  'price_qar', 'price_omr', 'price_bhd', 'price_krw',
  'price_thb', 'price_myr', 'price_sgd', 'price_hkd',
  'price_dkk', 'price_sek', 'price_nok', 'price_pln',
  'price_czk', 'price_huf', 'price_ron', 'price_nzd',

  // ═══ فلزات (۱۲) ═══
  'silver', 'silver_999', 'silver_925',
  'platinum', 'palladium', 'copper', 'aluminium',
  'nickel', 'zinc', 'lead', 'cobalt', 'base_global_tin',

  // ═══ انرژی (۸) ═══
  'oil', 'oil_brent', 'energy_natural_gas',
  'energy_gasoline_rbob', 'oil_opec', 'oil_urals',
  'energy_azeri_light', 'energy_methanol',

  // ═══ کریپتو (۲۰) ═══
  'crypto-bitcoin', 'crypto-ethereum', 'crypto-tether',
  'crypto-binance-coin', 'crypto-ripple', 'crypto-cardano',
  'crypto-solana', 'crypto-dogecoin', 'crypto-litecoin',
  'crypto-polkadot', 'crypto-chainlink', 'crypto-avalanche',
  'crypto-monero', 'crypto-dash', 'crypto-stellar',
  'crypto-tezos', 'crypto-eos', 'crypto-tron',
  'crypto-toncoin', 'crypto-shiba-inu',

  // ═══ کالا (۱۰) ═══
  'commodity_us_wheat', 'commodity_corn',
  'commodity_us_sugar_no11', 'commodity_us_coffee_c',
  'commodity_soybeans', 'commodity_us_cocoa',
  'commodity_cotton', 'commodity_rough_rice',
  'commodity_oats', 'commodity_lumber',

  // ═══ توکن طلا (۵) ═══
  'tether_gold_xaut', 'crypto_paxg_gold', 'crypto_ugold_inc',
  'crypto_gold_kau', 'crypto_gold_dao'
];

/**
 * ✅ نمادهای دائمی برای نمودار (هر ۱۵ دقیقه ذخیره می‌شن)
 * این‌ها در data/history/YYYY-MM-DD.json ذخیره می‌شن
 */
export const HISTORY_SYMBOLS = [
  // طلا
  'geram18', 'geram24', 'mesghal', 'sekeb', 'sekee', 'nim', 'rob',
  // ارز
  'price_dollar_rl', 'price_eur', 'price_gbp', 'price_aed',
  'price_try', 'price_cny', 'price_jpy',
  // فلزات
  'silver', 'platinum', 'palladium', 'copper',
  // انرژی
  'oil', 'oil_brent', 'energy_natural_gas',
  // کریپتو
  'crypto-bitcoin', 'crypto-ethereum', 'crypto-solana',
  // کالا
  'commodity_us_wheat', 'commodity_corn',
  // شاخص
  'bourse', 'dow_jones_us', 'nasdaq_us', 's_p_500_us',
  // توکن طلا
  'tether_gold_xaut'
];
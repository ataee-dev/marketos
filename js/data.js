/**
 * قیمتو 5.1 — DATA
 * ۳۰۰+ نماد TGJU
 */
window.DATA = (function(){
'use strict';

const CATEGORIES = {
  gold:       {label:'طلا و سکه',   icon:'coins',      color:'gold'},
  currency:   {label:'ارز',         icon:'dollarSign', color:'blue'},
  metal:      {label:'فلزات',       icon:'diamond',    color:'purple'},
  energy:     {label:'انرژی',       icon:'zap',        color:'orange'},
  crypto:     {label:'کریپتو',      icon:'bitcoin',    color:'orange'},
  commodity:  {label:'کالا',        icon:'briefcase',  color:'green'},
  index:      {label:'شاخص‌ها',     icon:'barChart',   color:'cyan'},
  goldCrypto: {label:'توکن طلا',    icon:'coins',      color:'gold'},
  ratio:      {label:'نسبت‌ها',     icon:'trendingUp', color:'purple'}
};

const ASSETS = [
  /* ===== طلا و سکه (۱۵) ===== */
  {id:'gold18',       tgju:'geram18',           name:'طلای ۱۸ عیار',   short:'طلای ۱۸',  code:'GOLD18',  cat:'gold', ptype:'rial', unit:'گرم',  dec:0, popular:true},
  {id:'gold24',       tgju:'geram24',           name:'طلای ۲۴ عیار',   short:'طلای ۲۴',  code:'GOLD24',  cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold17',       tgju:'gold_17',           name:'طلای ۱۷ عیار',   short:'طلای ۱۷',  code:'GOLD17',  cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold17_coin',  tgju:'gold_17_coin',      name:'طلای ۱۷ سکه‌ای', short:'طلا ۱۷ سکه',code:'GOLD17C',cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold17_transfer',tgju:'gold_17_transfer',name:'طلای ۱۷ حواله',  short:'طلا ۱۷ حواله',code:'GOLD17T',cat:'gold',ptype:'rial',unit:'گرم',  dec:0},
  {id:'mesghal',      tgju:'mesghal',           name:'مثقال طلا',      short:'مثقال',    code:'MESGHAL', cat:'gold', ptype:'rial', unit:'عدد',  dec:0, popular:true},
  {id:'gold_melted',  tgju:'gold_melted_wholesale',name:'آبشده عمده',  short:'آبشده عمده',code:'MELTED', cat:'gold', ptype:'rial', unit:'گرم',  dec:0, popular:true},
  {id:'gold_transfer',tgju:'gold_melted_transfer',name:'آبشده حواله',  short:'آبشده حواله',code:'MELT-T',cat:'gold',ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold_futures', tgju:'gold_futures',      name:'آبشده نقدی',     short:'آبشده نقدی',code:'FUTURES',cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold_mini',    tgju:'gold_mini_size',    name:'طلای مینی ۷۴۰',  short:'مینی ۷۴۰', code:'MINI740', cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold_740k',    tgju:'gold_740k',         name:'طلای ۷۴۰ عیار',  short:'طلای ۷۴۰', code:'GOLD740', cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'gold_world',   tgju:'gold_world_futures',name:'طلای جهانی آتی', short:'طلا جهانی',code:'XAUF',    cat:'gold', ptype:'rial', unit:'گرم',  dec:0},
  {id:'ounce',        tgju:'ons',               name:'انس طلای جهانی', short:'انس طلا',  code:'XAU',     cat:'gold', ptype:'usd',  unit:'اونس', dec:2, popular:true},
  {id:'coin',         tgju:'sekeb',             name:'سکه امامی',      short:'سکه امامی',code:'COIN',    cat:'gold', ptype:'rial', unit:'عدد',  dec:0, popular:true},
  {id:'coin_bahar',   tgju:'sekee',             name:'سکه بهار آزادی', short:'بهار آزادی',code:'BAHAR',  cat:'gold', ptype:'rial', unit:'عدد',  dec:0, popular:true},
  {id:'nim',          tgju:'nim',               name:'نیم سکه',        short:'نیم سکه',  code:'HALF',    cat:'gold', ptype:'rial', unit:'عدد',  dec:0, popular:true},
  {id:'rob',          tgju:'rob',               name:'ربع سکه',        short:'ربع سکه',  code:'QUARTER', cat:'gold', ptype:'rial', unit:'عدد',  dec:0},
  {id:'gerami',       tgju:'gerami',            name:'سکه گرمی',       short:'گرمی',     code:'GERAMI',  cat:'gold', ptype:'rial', unit:'عدد',  dec:0},

  /* ===== ارزهای اصلی (۳۰) ===== */
  {id:'dollar',    tgju:'price_dollar_rl', name:'دلار آمریکا',  short:'دلار',    code:'USD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'us', popular:true},
  {id:'dollar_dt', tgju:'price_dollar_dt', name:'دلار دولتی',   short:'دلار دولتی',code:'USD-G',cat:'currency',ptype:'rial',unit:'عدد', dec:0, flag:'us'},
  {id:'dollar_ex', tgju:'price_dollar_ex', name:'دلار صرافی',   short:'دلار صرافی',code:'USD-E',cat:'currency',ptype:'rial',unit:'عدد', dec:0, flag:'us'},
  {id:'euro',      tgju:'price_eur',       name:'یورو',          short:'یورو',    code:'EUR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'eu', popular:true},
  {id:'gbp',       tgju:'price_gbp',       name:'پوند انگلیس',  short:'پوند',    code:'GBP', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'gb'},
  {id:'aed',       tgju:'price_aed',       name:'درهم امارات',  short:'درهم',    code:'AED', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ae'},
  {id:'try_',      tgju:'price_try',       name:'لیر ترکیه',    short:'لیر',     code:'TRY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'tr'},
  {id:'cny',       tgju:'price_cny',       name:'یوان چین',     short:'یوان',    code:'CNY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'cn'},
  {id:'jpy',       tgju:'price_jpy',       name:'ین ژاپن',      short:'ین',      code:'JPY', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'jp'},
  {id:'cad',       tgju:'price_cad',       name:'دلار کانادا',  short:'کانادا',  code:'CAD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ca'},
  {id:'aud',       tgju:'price_aud',       name:'دلار استرالیا',short:'استرالیا',code:'AUD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'au'},
  {id:'chf',       tgju:'price_chf',       name:'فرانک سوئیس',  short:'فرانک',   code:'CHF', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ch'},
  {id:'rub',       tgju:'price_rub',       name:'روبل روسیه',   short:'روبل',    code:'RUB', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ru'},
  {id:'sar',       tgju:'price_sar',       name:'ریال سعودی',   short:'سعودی',   code:'SAR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'sa'},
  {id:'kwd',       tgju:'price_kwd',       name:'دینار کویت',   short:'کویت',    code:'KWD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'kw'},
  {id:'qar',       tgju:'price_qar',       name:'ریال قطر',     short:'قطر',     code:'QAR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'qa'},
  {id:'omr',       tgju:'price_omr',       name:'ریال عمان',    short:'عمان',    code:'OMR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'om'},
  {id:'bhd',       tgju:'price_bhd',       name:'دینار بحرین',  short:'بحرین',   code:'BHD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'bh'},
  {id:'iqd',       tgju:'price_iqd',       name:'دینار عراق',   short:'عراق',    code:'IQD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'iq'},
  {id:'afn',       tgju:'price_afn',       name:'افغانی',        short:'افغانی',  code:'AFN', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'af'},
  {id:'inr',       tgju:'price_inr',       name:'روپیه هند',    short:'هند',     code:'INR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'in'},
  {id:'pkr',       tgju:'price_pkr',       name:'روپیه پاکستان',short:'پاکستان', code:'PKR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'pk'},
  {id:'myr',       tgju:'price_myr',       name:'رینگیت مالزی', short:'مالزی',   code:'MYR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'my'},
  {id:'thb',       tgju:'price_thb',       name:'بات تایلند',   short:'تایلند',  code:'THB', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'th'},
  {id:'sgd',       tgju:'price_sgd',       name:'دلار سنگاپور', short:'سنگاپور', code:'SGD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'sg'},
  {id:'hkd',       tgju:'price_hkd',       name:'دلار هنگ‌کنگ', short:'هنگ‌کنگ', code:'HKD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'hk'},
  {id:'krw',       tgju:'price_krw',       name:'وون کره',      short:'کره',     code:'KRW', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'kr'},
  {id:'twd',       tgju:'price_twd',       name:'دلار تایوان',  short:'تایوان',  code:'TWD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'tw'},
  {id:'sek',       tgju:'price_sek',       name:'کرون سوئد',    short:'سوئد',    code:'SEK', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'se'},
  {id:'nok',       tgju:'price_nok',       name:'کرون نروژ',    short:'نروژ',    code:'NOK', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'no'},
  {id:'dkk',       tgju:'price_dkk',       name:'کرون دانمارک', short:'دانمارک', code:'DKK', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'dk'},
  {id:'pln',       tgju:'price_pln',       name:'زلوتی لهستان', short:'لهستان',  code:'PLN', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'pl'},
  {id:'czk',       tgju:'price_czk',       name:'کرون چک',      short:'چک',      code:'CZK', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'cz'},
  {id:'huf',       tgju:'price_huf',       name:'فورینت مجارستان',short:'مجارستان',code:'HUF',cat:'currency',ptype:'rial',unit:'عدد', dec:0, flag:'hu'},
  {id:'ron',       tgju:'price_ron',       name:'لئو رومانی',   short:'رومانی',  code:'RON', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ro'},
  {id:'bgn',       tgju:'price_bgn',       name:'لو بلغارستان', short:'بلغارستان',code:'BGN',cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'bg'},
  {id:'nzd',       tgju:'price_nzd',       name:'دلار نیوزیلند',short:'نیوزیلند',code:'NZD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'nz'},
  {id:'brl',       tgju:'price_brl',       name:'رئال برزیل',   short:'برزیل',   code:'BRL', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'br'},
  {id:'mxn',       tgju:'price_mxn',       name:'پزو مکزیک',    short:'مکزیک',   code:'MXN', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'mx'},
  {id:'zar',       tgju:'price_zar',       name:'رند آفریقا',   short:'آفریقا',  code:'ZAR', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'za'},
  {id:'egp',       tgju:'price_egp',       name:'پوند مصر',     short:'مصر',     code:'EGP', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'eg'},
  {id:'azn',       tgju:'price_azn',       name:'منات آذربایجان',short:'آذربایجان',code:'AZN',cat:'currency',ptype:'rial',unit:'عدد', dec:0, flag:'az'},
  {id:'amd',       tgju:'price_amd',       name:'درام ارمنستان',short:'ارمنستان',code:'AMD', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'am'},
  {id:'gel',       tgju:'price_gel',       name:'لاری گرجستان', short:'گرجستان', code:'GEL', cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'ge'},
  {id:'kgs',       tgju:'price_kgs',       name:'سوم قرقیزستان',short:'قرقیزستان',code:'KGS',cat:'currency', ptype:'rial', unit:'عدد', dec:0, flag:'kg'},

  /* ===== فلزات (۲۰) ===== */
  {id:'silver',    tgju:'silver',         name:'نقره (انس)',    short:'نقره',     code:'XAG', cat:'metal', ptype:'usd', unit:'اونس', dec:2, popular:true},
  {id:'silver_999',tgju:'silver_999',     name:'نقره ۹۹۹',      short:'نقره ۹۹۹', code:'AG999',cat:'metal', ptype:'rial', unit:'گرم',  dec:0},
  {id:'silver_925',tgju:'silver_925',     name:'نقره ۹۲۵',      short:'نقره ۹۲۵', code:'AG925',cat:'metal', ptype:'rial', unit:'گرم',  dec:0},
  {id:'platinum',  tgju:'platinum',       name:'پلاتین',         short:'پلاتین',   code:'XPT', cat:'metal', ptype:'usd',  unit:'اونس', dec:2},
  {id:'palladium', tgju:'palladium',      name:'پالادیوم',       short:'پالادیوم', code:'XPD', cat:'metal', ptype:'usd',  unit:'اونس', dec:2},
  {id:'copper',    tgju:'copper',         name:'مس',             short:'مس',       code:'XCU', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'aluminium', tgju:'aluminium',      name:'آلومینیوم',      short:'آلومینیوم',code:'ALU', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'nickel',    tgju:'nickel',         name:'نیکل',           short:'نیکل',     code:'NIC', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'zinc',      tgju:'zinc',           name:'روی',            short:'روی',      code:'ZNC', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'lead',      tgju:'lead',           name:'سرب',            short:'سرب',      code:'LED', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'cobalt',    tgju:'cobalt',         name:'کبالت',          short:'کبالت',    code:'COB', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'tin',       tgju:'base_global_tin',name:'قلع',            short:'قلع',      code:'TIN', cat:'metal', ptype:'usd',  unit:'تن',   dec:2},
  {id:'uranium',   tgju:'base-us-uranium',name:'اورانیوم',       short:'اورانیوم', code:'URA', cat:'metal', ptype:'usd',  unit:'پوند', dec:2},
  {id:'rhodium',   tgju:'commodity_rhodium',name:'رودیوم',       short:'رودیوم',   code:'RH',  cat:'metal', ptype:'usd',  unit:'اونس', dec:0},

  /* ===== انرژی (۱۵) ===== */
  {id:'oil',       tgju:'oil',                name:'نفت WTI',   short:'WTI',    code:'WTI',   cat:'energy', ptype:'usd', unit:'بشکه',  dec:2, popular:true},
  {id:'oil_brent', tgju:'oil_brent',          name:'نفت برنت',  short:'برنت',   code:'BRENT', cat:'energy', ptype:'usd', unit:'بشکه',  dec:3, popular:true},
  {id:'gas',       tgju:'energy_natural_gas', name:'گاز طبیعی', short:'گاز',    code:'NG',    cat:'energy', ptype:'usd', unit:'MMBtu', dec:3},
  {id:'gasoline',  tgju:'energy_gasoline_rbob',name:'بنزین',    short:'بنزین',  code:'RBOB',  cat:'energy', ptype:'usd', unit:'گالن',  dec:3},
  {id:'carbon',    tgju:'energy_carbon_emissions',name:'کربن',  short:'کربن',   code:'CO2',   cat:'energy', ptype:'usd', unit:'تن',    dec:2},
  {id:'methanol',  tgju:'energy_methanol',    name:'متانول',    short:'متانول', code:'MET',   cat:'energy', ptype:'usd', unit:'تن',    dec:2},
  {id:'naphtha',   tgju:'energy_naphtha',     name:'نفتا',      short:'نفتا',   code:'NAP',   cat:'energy', ptype:'usd', unit:'تن',    dec:2},
  {id:'propane',   tgju:'energy_propane',     name:'پروپان',    short:'پروپان', code:'PRO',   cat:'energy', ptype:'usd', unit:'گالن',  dec:2},
  {id:'oil_opec',  tgju:'oil_opec',           name:'سبد اوپک',  short:'اوپک',   code:'OPEC',  cat:'energy', ptype:'usd', unit:'بشکه',  dec:2},
  {id:'oil_urals', tgju:'energy_urals',       name:'نفت اورال', short:'اورال',  code:'URALS', cat:'energy', ptype:'usd', unit:'بشکه',  dec:2},
  {id:'oil_azeri', tgju:'energy_azeri_light', name:'نفت آذری',  short:'آذری',   code:'AZERI', cat:'energy', ptype:'usd', unit:'بشکه',  dec:2},

  /* ===== کریپتو (۳۵) ===== */
  {id:'btc',  tgju:'crypto-bitcoin',      name:'بیت‌کوین',   short:'بیت‌کوین', code:'BTC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, popular:true},
  {id:'eth',  tgju:'crypto-ethereum',     name:'اتریوم',     short:'اتریوم',   code:'ETH', cat:'crypto', ptype:'usd', unit:'عدد', dec:2, popular:true},
  {id:'usdt', tgju:'crypto-tether',       name:'تتر',        short:'تتر',      code:'USDT',cat:'crypto', ptype:'usd', unit:'عدد', dec:4, popular:true},
  {id:'bnb',  tgju:'crypto-binance-coin', name:'بایننس کوین',short:'BNB',      code:'BNB', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'xrp',  tgju:'crypto-ripple',       name:'ریپل',       short:'ریپل',     code:'XRP', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'ada',  tgju:'crypto-cardano',      name:'کاردانو',    short:'کاردانو',  code:'ADA', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'sol',  tgju:'crypto-solana',       name:'سولانا',     short:'سولانا',   code:'SOL', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'doge', tgju:'crypto-dogecoin',     name:'دوج‌کوین',   short:'دوج',      code:'DOGE',cat:'crypto', ptype:'usd', unit:'عدد', dec:8},
  {id:'ltc',  tgju:'crypto-litecoin',     name:'لایت‌کوین',  short:'لایت',     code:'LTC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'dot',  tgju:'crypto-polkadot',     name:'پولکادات',   short:'پولکا',    code:'DOT', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'link', tgju:'crypto-chainlink',    name:'چین‌لینک',   short:'چین‌لینک', code:'LINK',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'avax', tgju:'crypto-avalanche',    name:'آوالانچ',    short:'آوالانچ',  code:'AVAX',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'xmr',  tgju:'crypto-monero',       name:'مونرو',      short:'مونرو',    code:'XMR', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'dash', tgju:'crypto-dash',         name:'دش',         short:'دش',       code:'DASH',cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'xlm',  tgju:'crypto-stellar',      name:'استلار',     short:'استلار',   code:'XLM', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'xtz',  tgju:'crypto-tezos',        name:'تزوس',       short:'تزوس',     code:'XTZ', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'eos',  tgju:'crypto-eos',          name:'EOS',        short:'EOS',      code:'EOS', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'trx',  tgju:'crypto-tron',         name:'ترون',       short:'ترون',     code:'TRX', cat:'crypto', ptype:'usd', unit:'عدد', dec:6},
  {id:'ton',  tgju:'crypto-toncoin',      name:'تون‌کوین',   short:'تون',      code:'TON', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'zec',  tgju:'crypto-zcash',        name:'زی‌کش',      short:'زی‌کش',    code:'ZEC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'bch',  tgju:'crypto-bitcoin-cash', name:'بیت‌کوین کش',short:'BCH',      code:'BCH', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'etc',  tgju:'crypto-ethereum-classic',name:'اتریوم کلاسیک',short:'ETC',code:'ETC', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'shib', tgju:'crypto-shiba-inu',    name:'شیبا اینو',  short:'شیبا',     code:'SHIB',cat:'crypto', ptype:'usd', unit:'عدد', dec:10},
  {id:'uni',  tgju:'crypto-uniswap',      name:'یونی‌سواپ',  short:'یونی',     code:'UNI', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'fil',  tgju:'crypto-filecoin',     name:'فایل‌کوین',  short:'فایل',     code:'FIL', cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'atom', tgju:'crypto-cosmos',       name:'کازموس',     short:'کازموس',   code:'ATOM',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'cake', tgju:'crypto-pancakeswap',  name:'پنکیک‌سواپ', short:'پنکیک',    code:'CAKE',cat:'crypto', ptype:'usd', unit:'عدد', dec:2},
  {id:'sand', tgju:'crypto-sandbox',      name:'سندباکس',    short:'سند',      code:'SAND',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'gala', tgju:'crypto-gala',         name:'گالا',       short:'گالا',     code:'GALA',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'flow', tgju:'crypto-flow',         name:'فلو',        short:'فلو',      code:'FLOW',cat:'crypto', ptype:'usd', unit:'عدد', dec:4},
  {id:'dcr',  tgju:'crypto-decred',       name:'دی‌کرد',     short:'DCR',      code:'DCR', cat:'crypto', ptype:'usd', unit:'عدد', dec:2},

  /* ===== توکن طلا (۵) ===== */
  {id:'xaut',  tgju:'tether_gold_xaut',    name:'تتر گلد',   short:'XAUT',  code:'XAUT',  cat:'goldCrypto', ptype:'usd', unit:'توکن', dec:2},
  {id:'paxg',  tgju:'crypto_paxg_gold',    name:'پکس گلد',   short:'PAXG',  code:'PAXG',  cat:'goldCrypto', ptype:'usd', unit:'توکن', dec:2},
  {id:'ugold', tgju:'crypto_ugold_inc',    name:'یوگلد',     short:'UGOLD', code:'UGOLD', cat:'goldCrypto', ptype:'usd', unit:'توکن', dec:2},
  {id:'kau',   tgju:'crypto_gold_kau',     name:'کائو',      short:'KAU',   code:'KAU',   cat:'goldCrypto', ptype:'usd', unit:'توکن', dec:2},
  {id:'gdao',  tgju:'crypto_gold_dao',     name:'گلد دائو',  short:'GDAO',  code:'GDAO',  cat:'goldCrypto', ptype:'usd', unit:'توکن', dec:6},

  /* ===== شاخص‌ها (۸) ===== */
  {id:'bourse',    tgju:'bourse',            name:'بورس تهران',  short:'بورس تهران',code:'TSE', cat:'index', ptype:'rial', unit:'واحد', dec:0, popular:true},
  {id:'dowjones',  tgju:'dow_jones_us',      name:'داو جونز',    short:'داو جونز',  code:'DJI', cat:'index', ptype:'usd',  unit:'واحد', dec:2},
  {id:'nasdaq',    tgju:'nasdaq_us',         name:'نزدک',        short:'نزدک',      code:'IXIC',cat:'index', ptype:'usd',  unit:'واحد', dec:2},
  {id:'sp500',     tgju:'s_p_500_us',        name:'S&P 500',     short:'S&P 500',   code:'SPX', cat:'index', ptype:'usd',  unit:'واحد', dec:2},
  {id:'nikkei',    tgju:'bourse_nikkei-225', name:'نیکی ۲۲۵',    short:'نیکی',      code:'N225',cat:'index', ptype:'usd',  unit:'واحد', dec:0},
  {id:'stoxx',     tgju:'bourse_stoxx-600',  name:'STOXX 600',   short:'STOXX',     code:'SXXP',cat:'index', ptype:'usd',  unit:'واحد', dec:0},

  /* ===== کالا (۱۵) ===== */
  {id:'wheat',    tgju:'commodity_us_wheat',     name:'گندم',    short:'گندم',    code:'WHEAT', cat:'commodity', ptype:'usd', unit:'بوشل', dec:2},
  {id:'corn',     tgju:'commodity_corn',         name:'ذرت',     short:'ذرت',     code:'CORN',  cat:'commodity', ptype:'usd', unit:'بوشل', dec:2},
  {id:'soybeans', tgju:'commodity_soybeans',     name:'سویا',    short:'سویا',    code:'SOY',   cat:'commodity', ptype:'usd', unit:'بوشل', dec:2},
  {id:'sugar',    tgju:'commodity_us_sugar_no11',name:'شکر',     short:'شکر',     code:'SUGAR', cat:'commodity', ptype:'usd', unit:'پوند', dec:2},
  {id:'coffee',   tgju:'commodity_us_coffee_c',  name:'قهوه',    short:'قهوه',    code:'COFFEE',cat:'commodity', ptype:'usd', unit:'پوند', dec:2},
  {id:'cocoa',    tgju:'commodity_us_cocoa',     name:'کاکائو',  short:'کاکائو',  code:'COCOA', cat:'commodity', ptype:'usd', unit:'تن',   dec:2},
  {id:'cotton',   tgju:'commodity_cotton',       name:'پنبه',    short:'پنبه',    code:'COTTON',cat:'commodity', ptype:'usd', unit:'پوند', dec:2},
  {id:'rice',     tgju:'commodity_rough_rice',   name:'برنج',    short:'برنج',    code:'RICE',  cat:'commodity', ptype:'usd', unit:'cwt',  dec:2},
  {id:'oats',     tgju:'commodity_oats',         name:'جو دوسر', short:'جو',      code:'OATS',  cat:'commodity', ptype:'usd', unit:'بوشل', dec:2},
  {id:'lumber',   tgju:'commodity_lumber',       name:'الوار',   short:'الوار',   code:'LUMBER',cat:'commodity', ptype:'usd', unit:'MBF',  dec:2},

  /* ===== نسبت‌ها (۵) ===== */
  {id:'ratio_xau',   tgju:'ratio_xau',       name:'نسبت طلا/نقره',  short:'طلا/نقره', code:'XAU/XAG',cat:'ratio', ptype:'usd', unit:'', dec:2},
  {id:'ratio_silver',tgju:'ratio_silver',    name:'نسبت نقره',      short:'نقره',     code:'XAG',    cat:'ratio', ptype:'usd', unit:'', dec:2},
  {id:'ratio_plat',  tgju:'ratio_platinum',  name:'نسبت پلاتین',    short:'پلاتین',   code:'XPT',    cat:'ratio', ptype:'usd', unit:'', dec:2},
  {id:'ratio_oil',   tgju:'ratio_crudeoil',  name:'نسبت نفت',       short:'نفت',      code:'OIL',    cat:'ratio', ptype:'usd', unit:'', dec:2}
];

const BY_ID = {};
const BY_TGJU = {};
ASSETS.forEach(a => {
  BY_ID[a.id] = a;
  BY_TGJU[a.tgju] = a;
});

const FEATURED = ASSETS.filter(a => a.popular).map(a => a.id);

const MOST_USED = [
  'gold18', 'coin', 'dollar', 'euro', 'ounce', 'mesghal',
  'btc', 'eth', 'usdt', 'silver', 'oil_brent', 'bourse'
];

return {
  CATEGORIES: CATEGORIES,
  ASSETS: ASSETS,
  FEATURED: FEATURED,
  MOST_USED: MOST_USED,
  find: function(id){ return BY_ID[id] || null; },
  byTgju: function(k){ return BY_TGJU[k] || null; },
  byCat: function(c){ return ASSETS.filter(function(a){ return a.cat === c; }); },
  countByCat: function(){
    const o = {};
    Object.keys(CATEGORIES).forEach(function(c){ o[c] = 0; });
    ASSETS.forEach(function(a){ o[a.cat] = (o[a.cat] || 0) + 1; });
    return o;
  },
  count: function(){ return ASSETS.length; }
};

})();
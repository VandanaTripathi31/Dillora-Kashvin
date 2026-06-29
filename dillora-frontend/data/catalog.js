// ============================================================
// DILORA — Catalog (real product photos, auto-generated)
// Images live in /public/images/<category>/<sub>/NN.jpg
// Mirrors the MongoDB "products" + "categories" shape; the API
// module (api.js) swaps these arrays for fetch() when the backend
// is connected — components don't change.
// ============================================================

// Just the brands — the customer types their exact model in a text field, so
// the list never goes stale when new phones launch. Keep "Other" last as a
// catch-all for any brand not listed.
export const PHONE_BRANDS = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Poco', 'Vivo', 'iQOO',
  'Oppo', 'Realme', 'Motorola', 'Google Pixel', 'Nothing', 'Infinix', 'Tecno', 'Lava',
  'Other',
];

export const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const CATEGORIES = [
  { id: 'mobile-covers', name: 'Mobile Covers', tagline: 'Designed for your phone, made to order',
    subs: [{ id: 'soft-case', name: 'Soft Silicon Case' }] },
  { id: 'mobile-charms', name: 'Mobile Charms', tagline: 'The little finishing touch',
    subs: [{ id: 'charms', name: 'Charms' }] },
  { id: 'crochet', name: 'Crochet', tagline: 'Handmade with love, stitch by stitch',
    subs: [
      { id: 'coin-pouch', name: 'Coin Pouch' },
      { id: 'coaster', name: 'Coasters' },
      { id: 'earbuds-case', name: 'Earbuds Case' },
      { id: 'laptop-cover', name: 'Laptop Sleeve' },
      { id: 'sunglass-holder', name: 'Sunglass Holder' },
    ] },
  { id: 'resin-art', name: 'Resin Art', tagline: 'Poured, set and polished by hand',
    subs: [
      { id: 'wall-clock', name: 'Wall Clock' },
      { id: 'coaster-set', name: 'Coaster & Tray Set' },
    ] },
  { id: 'tshirts', name: 'Oversize T-Shirts', tagline: 'Relaxed fits in soft cotton',
    subs: [{ id: 'him', name: 'His' }, { id: 'her', name: 'Her' }] },
];

// Representative image per category (used by the homepage category circles & hero).
export const CATEGORY_IMG = {
  "mobile-covers": "/images/mobile-covers/soft-case/01.jpg",
  "mobile-charms": "/images/mobile-charms/charms/01.jpg",
  "crochet": "/images/crochet/coin-pouch/01.jpg",
  "resin-art": "/images/resin-art/wall-clock/01.jpg",
  "tshirts": "/images/tshirts/him/01.jpg"
};

export const PRODUCTS = [
  {"id":"p1","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 01","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/01.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p2","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 02","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/02.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p3","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 03","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/03.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p4","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 04","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/04.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p5","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 05","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/05.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p6","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 06","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/06.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p7","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 07","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/07.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p8","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 08","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/08.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p9","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 09","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/09.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p10","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 10","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/10.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p11","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 11","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/11.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p12","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 12","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/12.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p13","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 13","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/13.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p14","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 14","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/14.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p15","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 15","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/15.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p16","category":"mobile-covers","sub":"soft-case","name":"Soft Silicon Phone Case — 16","price":299,"mrp":449,"stock":25,"optionType":"phone","image":"/images/mobile-covers/soft-case/16.jpg","materials":[{"name":"Soft Silicon","price":299}]},
  {"id":"p17","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 01","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/01.jpg"},
  {"id":"p18","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 02","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/02.jpg"},
  {"id":"p19","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 03","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/03.jpg"},
  {"id":"p20","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 04","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/04.jpg"},
  {"id":"p21","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 05","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/05.jpg"},
  {"id":"p22","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 06","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/06.jpg"},
  {"id":"p23","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 07","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/07.jpg"},
  {"id":"p24","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 08","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/08.jpg"},
  {"id":"p25","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 09","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/09.jpg"},
  {"id":"p26","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 10","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/10.jpg"},
  {"id":"p27","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 11","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/11.jpg"},
  {"id":"p28","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 12","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/12.jpg"},
  {"id":"p29","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 13","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/13.jpg"},
  {"id":"p30","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 14","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/14.jpg"},
  {"id":"p31","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 15","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/15.jpg"},
  {"id":"p32","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 16","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/16.jpg"},
  {"id":"p33","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 17","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/17.jpg"},
  {"id":"p34","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 18","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/18.jpg"},
  {"id":"p35","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 19","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/19.jpg"},
  {"id":"p36","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 20","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/20.jpg"},
  {"id":"p37","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 21","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/21.jpg"},
  {"id":"p38","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 22","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/22.jpg"},
  {"id":"p39","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 23","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/23.jpg"},
  {"id":"p40","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 24","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/24.jpg"},
  {"id":"p41","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 25","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/25.jpg"},
  {"id":"p42","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 26","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/26.jpg"},
  {"id":"p43","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 27","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/27.jpg"},
  {"id":"p44","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 28","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/28.jpg"},
  {"id":"p45","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 29","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/29.jpg"},
  {"id":"p46","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 30","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/30.jpg"},
  {"id":"p47","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 31","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/31.jpg"},
  {"id":"p48","category":"mobile-charms","sub":"charms","name":"Handmade Mobile Charm — 32","price":149,"mrp":249,"stock":25,"optionType":"none","image":"/images/mobile-charms/charms/32.jpg"},
  {"id":"p49","category":"crochet","sub":"coin-pouch","name":"Crochet Coin Pouch","price":299,"mrp":449,"stock":12,"optionType":"none","image":"/images/crochet/coin-pouch/01.jpg","gallery":["/images/crochet/coin-pouch/01.jpg","/images/crochet/coin-pouch/02.jpg","/images/crochet/coin-pouch/03.jpg","/images/crochet/coin-pouch/04.jpg","/images/crochet/coin-pouch/05.jpg"]},
  {"id":"p50","category":"crochet","sub":"coaster","name":"Crochet Coasters (Set of 4)","price":349,"mrp":549,"stock":12,"optionType":"none","image":"/images/crochet/coaster/01.jpg","gallery":["/images/crochet/coaster/01.jpg","/images/crochet/coaster/02.jpg","/images/crochet/coaster/03.jpg","/images/crochet/coaster/04.jpg","/images/crochet/coaster/05.jpg","/images/crochet/coaster/06.jpg"]},
  {"id":"p51","category":"crochet","sub":"earbuds-case","name":"Crochet Earbuds Case","price":249,"mrp":399,"stock":12,"optionType":"none","image":"/images/crochet/earbuds-case/01.jpg","gallery":["/images/crochet/earbuds-case/01.jpg","/images/crochet/earbuds-case/02.jpg","/images/crochet/earbuds-case/03.jpg","/images/crochet/earbuds-case/04.jpg"]},
  {"id":"p52","category":"crochet","sub":"laptop-cover","name":"Crochet Laptop Sleeve","price":699,"mrp":999,"stock":12,"optionType":"none","image":"/images/crochet/laptop-cover/01.jpg","gallery":["/images/crochet/laptop-cover/01.jpg","/images/crochet/laptop-cover/02.jpg","/images/crochet/laptop-cover/03.jpg"]},
  {"id":"p53","category":"crochet","sub":"sunglass-holder","name":"Crochet Sunglass Holder","price":299,"mrp":449,"stock":12,"optionType":"none","image":"/images/crochet/sunglass-holder/01.jpg","gallery":["/images/crochet/sunglass-holder/01.jpg","/images/crochet/sunglass-holder/02.jpg","/images/crochet/sunglass-holder/03.jpg","/images/crochet/sunglass-holder/04.jpg"]},
  {"id":"p54","category":"resin-art","sub":"wall-clock","name":"Resin Wall Clock","price":1299,"mrp":1799,"stock":12,"optionType":"resin","image":"/images/resin-art/wall-clock/01.jpg","gallery":["/images/resin-art/wall-clock/01.jpg","/images/resin-art/wall-clock/02.jpg","/images/resin-art/wall-clock/03.jpg","/images/resin-art/wall-clock/04.jpg","/images/resin-art/wall-clock/05.jpg"]},
  {"id":"p55","category":"resin-art","sub":"coaster-set","name":"Resin Coaster, Tray & Holder Set","price":999,"mrp":1499,"stock":12,"optionType":"resin","image":"/images/resin-art/coaster-set/01.jpg","gallery":["/images/resin-art/coaster-set/01.jpg","/images/resin-art/coaster-set/02.jpg","/images/resin-art/coaster-set/03.jpg","/images/resin-art/coaster-set/04.jpg","/images/resin-art/coaster-set/05.jpg","/images/resin-art/coaster-set/06.jpg","/images/resin-art/coaster-set/07.jpg"]},
  {"id":"p56","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 01","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/01.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p57","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 02","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/02.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p58","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 03","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/03.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p59","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 04","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/04.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p60","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 05","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/05.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p61","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 06","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/06.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p62","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 07","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/07.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p63","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 08","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/08.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p64","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 09","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/09.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p65","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 10","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/10.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p66","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 11","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/11.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p67","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 12","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/12.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p68","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 13","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/13.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p69","category":"tshirts","sub":"him","name":"Oversize Printed Tee · His — 14","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/him/14.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p70","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 01","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/01.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p71","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 02","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/02.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p72","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 03","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/03.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p73","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 04","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/04.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p74","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 05","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/05.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p75","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 06","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/06.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p76","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 07","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/07.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p77","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 08","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/08.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p78","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 09","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/09.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p79","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 10","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/10.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p80","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 11","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/11.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p81","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 12","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/12.jpg","sizes":["S","M","L","XL","XXL"]},
  {"id":"p82","category":"tshirts","sub":"her","name":"Oversize Printed Tee · Her — 13","price":699,"mrp":999,"stock":25,"optionType":"size","image":"/images/tshirts/her/13.jpg","sizes":["S","M","L","XL","XXL"]},
];

export const findCategory = (id) => CATEGORIES.find(c => c.id === id);

// Gallery: a product's own gallery if it has one, otherwise just its single image.
export function galleryFor(product) {
  return (product.gallery && product.gallery.length) ? product.gallery : [product.image];
}

// Stable "newness" ordering — later in the array = newer (for "newest" sort).
export function withMeta(products) {
  const n = products.length;
  return products.map((p, i) => ({ ...p, _order: n - i }));
}

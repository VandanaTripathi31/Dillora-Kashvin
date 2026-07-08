// ============================================================
// Phone brand + model catalog for the cover-ordering dropdowns.
// Seeded into the `brands` collection and kept in sync additively by
// seed/seedBrands.js (new brands + new models are added; existing admin edits
// are preserved). Admin can add/edit/deactivate/reorder from the dashboard.
// Covers popular India-market brands up to current generations.
// ============================================================

const B = (name, models) => ({ name, models });

export const BRANDS = [
  B("Apple", [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE (2022)", "iPhone XR", "iPhone XS Max",
  ]),
  B("Samsung", [
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24",
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy Z Fold 6", "Galaxy Z Flip 6", "Galaxy Z Fold 5", "Galaxy Z Flip 5",
    "Galaxy A55", "Galaxy A35", "Galaxy A54", "Galaxy A34", "Galaxy A25", "Galaxy A15", "Galaxy A14",
    "Galaxy M35", "Galaxy M34", "Galaxy M14", "Galaxy F55", "Galaxy F15",
  ]),
  B("OnePlus", [
    "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 11R",
    "OnePlus 10 Pro", "OnePlus 10T", "OnePlus 10R", "OnePlus 9 Pro", "OnePlus 9",
    "OnePlus Nord 4", "OnePlus Nord 3", "OnePlus Nord CE 4", "OnePlus Nord CE 3",
    "OnePlus Nord CE 3 Lite", "OnePlus Nord CE 2 Lite", "OnePlus Nord 2T",
  ]),
  B("Xiaomi", [
    "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13 Pro", "Xiaomi 13",
    "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 11T Pro", "Xiaomi 11T",
    "Mi 11X Pro", "Mi 11X", "Mi 10T Pro",
  ]),
  B("Redmi", [
    "Redmi Note 13 Pro+ 5G", "Redmi Note 13 Pro 5G", "Redmi Note 13 5G", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12", "Redmi Note 11 Pro", "Redmi Note 11",
    "Redmi 13C", "Redmi 12", "Redmi 12C", "Redmi 11 Prime", "Redmi 10", "Redmi A3", "Redmi A2",
  ]),
  B("Poco", [
    "Poco X6 Pro", "Poco X6", "Poco X5 Pro", "Poco X5",
    "Poco F6", "Poco F5", "Poco F4", "Poco M6 Pro", "Poco M6", "Poco M5", "Poco C65", "Poco C55",
  ]),
  B("Vivo", [
    "Vivo X100 Pro", "Vivo X100", "Vivo X90 Pro", "Vivo X90",
    "Vivo V30 Pro", "Vivo V30", "Vivo V29", "Vivo V27", "Vivo V25",
    "Vivo T3", "Vivo T2", "Vivo Y200", "Vivo Y100", "Vivo Y28", "Vivo Y17s",
  ]),
  B("Oppo", [
    "Oppo Find X7 Ultra", "Oppo Find N3 Flip",
    "Oppo Reno 12 Pro", "Oppo Reno 12", "Oppo Reno 11 Pro", "Oppo Reno 11", "Oppo Reno 10 Pro", "Oppo Reno 10",
    "Oppo F27 Pro+", "Oppo F25 Pro", "Oppo F23", "Oppo A79", "Oppo A78", "Oppo A59", "Oppo A18",
  ]),
  B("Realme", [
    "Realme GT 6", "Realme GT 5 Pro", "Realme 12 Pro+", "Realme 12 Pro", "Realme 12+", "Realme 12",
    "Realme 11 Pro+", "Realme 11 Pro", "Realme 11", "Realme Narzo 70 Pro", "Realme Narzo 70",
    "Realme C67", "Realme C55", "Realme C53", "Realme C51",
  ]),
  B("Motorola", [
    "Motorola Edge 50 Ultra", "Motorola Edge 50 Pro", "Motorola Edge 50 Fusion", "Motorola Edge 40",
    "Moto G84", "Moto G54", "Moto G34", "Moto G73", "Moto G62",
    "Motorola Razr 50 Ultra", "Motorola Razr 40", "Moto E14", "Moto E13",
  ]),
  B("Google Pixel", [
    "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8", "Pixel 8a",
    "Pixel 7 Pro", "Pixel 7", "Pixel 7a", "Pixel 6 Pro", "Pixel 6", "Pixel 6a",
  ]),
  B("Nothing", [
    "Nothing Phone (2a)", "Nothing Phone (2)", "Nothing Phone (1)", "CMF Phone 1",
  ]),
  B("iQOO", [
    "iQOO 12", "iQOO 11", "iQOO Neo 9 Pro", "iQOO Neo 7 Pro", "iQOO Neo 7",
    "iQOO Z9", "iQOO Z9x", "iQOO Z7 Pro", "iQOO Z7", "iQOO Z6",
  ]),
  B("Honor", [
    "Honor Magic 6 Pro", "Honor 200 Pro", "Honor 200", "Honor 90", "Honor 90 Lite",
    "Honor X9b", "Honor X8b", "Honor X7b", "Honor X6",
  ]),
  B("Asus", [
    "Asus ROG Phone 8 Pro", "Asus ROG Phone 8", "Asus ROG Phone 7", "Asus ROG Phone 6",
    "Asus Zenfone 11 Ultra", "Asus Zenfone 10", "Asus Zenfone 9",
  ]),
  B("Tecno", [
    "Tecno Phantom V Fold 2", "Tecno Camon 30 Pro", "Tecno Camon 30", "Tecno Camon 20 Pro",
    "Tecno Pova 6 Pro", "Tecno Pova 5", "Tecno Spark 20 Pro+", "Tecno Spark 20", "Tecno Spark Go 2024",
  ]),
  B("Infinix", [
    "Infinix Zero 30", "Infinix Note 40 Pro+", "Infinix Note 40 Pro", "Infinix Note 40",
    "Infinix Note 30", "Infinix Hot 40 Pro", "Infinix Hot 40", "Infinix Smart 8", "Infinix GT 20 Pro",
  ]),
  B("Lava", [
    "Lava Agni 2", "Lava Blaze Curve 5G", "Lava Blaze 2", "Lava Blaze Pro",
    "Lava Yuva 3", "Lava Yuva 2", "Lava Storm 5G",
  ]),
  B("Nokia", [
    "Nokia G42", "Nokia G22", "Nokia C32", "Nokia C22", "Nokia XR21", "Nokia X30", "Nokia G21",
  ]),
  B("Micromax", [
    "Micromax In 2c", "Micromax In 2b", "Micromax In Note 2", "Micromax In Note 1", "Micromax In 1",
  ]),
  B("Itel", [
    "Itel P55 5G", "Itel P55", "Itel A70", "Itel A60s", "Itel S23+", "Itel S23", "Itel Vision 3",
  ]),
];

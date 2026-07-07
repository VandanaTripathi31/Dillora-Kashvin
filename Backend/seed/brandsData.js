// ============================================================
// Starter phone brand + model catalog for the cover-ordering dropdowns.
// Seeded ONLY when the brands collection is empty (see seed.js), so admin
// edits are never overwritten. Admin can add/edit/deactivate/reorder from the
// dashboard afterwards. Not exhaustive — a sensible starting set of popular
// models per brand.
// ============================================================

const B = (name, models) => ({ name, models });

export const BRANDS = [
  B("Apple", [
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
    "Galaxy A54", "Galaxy A34", "Galaxy A14", "Galaxy A73", "Galaxy A53",
    "Galaxy M34", "Galaxy M14", "Galaxy F54",
    "Galaxy Z Fold 5", "Galaxy Z Flip 5",
  ]),
  B("OnePlus", [
    "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 11R",
    "OnePlus 10 Pro", "OnePlus 10T", "OnePlus 10R",
    "OnePlus 9 Pro", "OnePlus 9", "OnePlus 9R",
    "OnePlus Nord 3", "OnePlus Nord CE 3", "OnePlus Nord CE 3 Lite", "OnePlus Nord 2T",
  ]),
  B("Xiaomi", [
    "Xiaomi 14 Pro", "Xiaomi 14", "Xiaomi 13 Pro", "Xiaomi 13",
    "Xiaomi 12 Pro", "Xiaomi 12", "Xiaomi 11T Pro",
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Redmi Note 12 Pro", "Redmi Note 12", "Redmi 13C", "Redmi 12",
  ]),
  B("Redmi", [
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13 5G", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12 5G", "Redmi Note 12",
    "Redmi 13C", "Redmi 12", "Redmi 12C", "Redmi 11 Prime", "Redmi 10",
  ]),
  B("Poco", [
    "Poco X6 Pro", "Poco X6", "Poco X5 Pro", "Poco X5",
    "Poco F5", "Poco F5 Pro", "Poco M6 Pro", "Poco M5", "Poco C65",
  ]),
  B("Vivo", [
    "Vivo X100 Pro", "Vivo X100", "Vivo X90 Pro", "Vivo V29 Pro", "Vivo V29",
    "Vivo V27 Pro", "Vivo V27", "Vivo T2 Pro", "Vivo T2", "Vivo Y100", "Vivo Y56",
  ]),
  B("iQOO", [
    "iQOO 12", "iQOO 11", "iQOO Neo 9 Pro", "iQOO Neo 7 Pro", "iQOO Neo 7",
    "iQOO Z9", "iQOO Z7 Pro", "iQOO Z7",
  ]),
  B("Oppo", [
    "Oppo Find X7 Ultra", "Oppo Reno 11 Pro", "Oppo Reno 11", "Oppo Reno 10 Pro+",
    "Oppo Reno 10 Pro", "Oppo Reno 10", "Oppo F25 Pro", "Oppo F23", "Oppo A79", "Oppo A59",
  ]),
  B("Realme", [
    "Realme 12 Pro+", "Realme 12 Pro", "Realme 11 Pro+", "Realme 11 Pro",
    "Realme GT 6", "Realme Narzo 70 Pro", "Realme Narzo 60 Pro",
    "Realme C67", "Realme C55", "Realme C53",
  ]),
  B("Motorola", [
    "Moto Edge 50 Pro", "Moto Edge 40", "Moto Edge 40 Neo",
    "Moto G84", "Moto G73", "Moto G54", "Moto G34", "Moto G14",
  ]),
  B("Google Pixel", [
    "Pixel 8 Pro", "Pixel 8", "Pixel 8a", "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
    "Pixel 6 Pro", "Pixel 6", "Pixel 6a",
  ]),
  B("Nothing", [
    "Nothing Phone (2)", "Nothing Phone (2a)", "Nothing Phone (1)",
  ]),
];

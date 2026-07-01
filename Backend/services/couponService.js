/**
 * Coupon validation — ported verbatim from the storefront's original
 * localValidateCoupon so discounts behave identically online and offline.
 *
 * @returns {{ok:true, discount:number, coupon:object} | {ok:false, reason:string}}
 */
export function evaluateCoupon(coupon, subtotal, items = []) {
  if (!coupon) return { ok: false, reason: "Invalid code." };
  if (!coupon.active) return { ok: false, reason: "This code is no longer active." };
  if (coupon.expiry && new Date(coupon.expiry) < new Date(new Date().toDateString())) {
    return { ok: false, reason: "This code has expired." };
  }
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return {
      ok: false,
      reason: `Add ₹${(coupon.minOrder - subtotal).toLocaleString("en-IN")} more to use this code.`,
    };
  }

  let discount = 0;
  if (coupon.type === "bogo") {
    const buy = Math.max(1, Number(coupon.buyQty) || 1);
    const free = Math.max(1, Number(coupon.freeQty) || 1);
    const units = [];
    for (const it of items) for (let i = 0; i < it.qty; i++) units.push(it.price);
    units.sort((a, b) => a - b);
    const groupSize = buy + free;
    const fullGroups = Math.floor(units.length / groupSize);
    if (fullGroups === 0) {
      return {
        ok: false,
        reason: `Add ${groupSize - units.length} more item(s) to use this Buy ${buy} Get ${free} offer.`,
      };
    }
    for (let i = 0; i < free * fullGroups; i++) discount += units[i];
  } else if (coupon.type === "flat") {
    discount = Math.min(coupon.value, subtotal);
  } else {
    discount = Math.round((subtotal * coupon.value) / 100);
  }

  return {
    ok: true,
    discount,
    coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
  };
}

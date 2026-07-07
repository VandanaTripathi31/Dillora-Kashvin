import Offer from "../models/Offer.js";

/** IST date as YYYY-MM-DD for date-window comparisons. */
const todayStr = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

function inWindow(offer, today) {
  if (offer.startDate && today < offer.startDate) return false;
  if (offer.endDate && today > offer.endDate) return false;
  return true;
}

const matches = (unit, scope, ref) =>
  scope === "product" ? unit.productId === ref : unit.category === ref;

/**
 * Evaluate all active offers against the cart and return the discounts that
 * auto-apply. Offers are processed by priority (desc); a unit made free by one
 * offer can't be reused by another.
 *
 * @param {Array} items - cart lines: [{ productId, category, price, qty }]
 * @returns {Promise<{offers: Array, discount: number}>}
 */
export async function evaluateOffers(items = []) {
  const today = todayStr();
  const all = await Offer.find({ active: true }).sort({ priority: -1, createdAt: 1 });

  // Expand into individual units so "cheapest item free" is fair.
  const units = [];
  for (const it of items) {
    const qty = Math.max(0, Math.floor(Number(it.qty) || 0));
    for (let i = 0; i < qty; i++) {
      units.push({
        productId: it.productId,
        category: it.category,
        price: Number(it.price) || 0,
        freed: false,
      });
    }
  }

  const applied = [];
  let total = 0;

  for (const offer of all) {
    if (!inWindow(offer, today)) continue;
    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) continue;

    const buyQty = Math.max(1, Math.floor(Number(offer.buy.qty) || 1));
    const buyUnits = units.filter((u) => !u.freed && matches(u, offer.buy.scope, offer.buy.ref));
    if (buyUnits.length < buyQty) continue;

    const sameSet = offer.buy.scope === offer.reward.scope && offer.buy.ref === offer.reward.ref;
    let discount = 0;
    const freeItems = [];

    if (offer.reward.type === "free") {
      const rewardQty = Math.max(1, Math.floor(Number(offer.reward.qty) || 1));
      let multiplier;
      let candidates;
      if (sameSet) {
        // Group = buy + free (e.g. buy 2 get 1 → every 3 items, 1 free).
        multiplier = Math.floor(buyUnits.length / (buyQty + rewardQty));
        candidates = [...buyUnits].sort((a, b) => a.price - b.price);
      } else {
        multiplier = Math.floor(buyUnits.length / buyQty);
        candidates = units
          .filter((u) => !u.freed && matches(u, offer.reward.scope, offer.reward.ref))
          .sort((a, b) => a.price - b.price);
      }
      const freeCount = Math.min(multiplier * rewardQty, candidates.length);
      if (freeCount <= 0) continue;
      for (let i = 0; i < freeCount; i++) {
        candidates[i].freed = true;
        discount += candidates[i].price;
        freeItems.push({ productId: candidates[i].productId, price: candidates[i].price });
      }
    } else {
      // percent / flat off the reward-matching subtotal (trigger already met).
      const rewardUnits = units.filter((u) => !u.freed && matches(u, offer.reward.scope, offer.reward.ref));
      const sub = rewardUnits.reduce((n, u) => n + u.price, 0);
      if (sub <= 0) continue;
      discount =
        offer.reward.type === "percent"
          ? (sub * (Number(offer.reward.value) || 0)) / 100
          : Math.min(Number(offer.reward.value) || 0, sub);
    }

    discount = Math.round(discount);
    if (discount > 0) {
      total += discount;
      applied.push({ id: offer.id, name: offer.name, description: offer.description, discount, freeItems });
    }
  }

  return { offers: applied, discount: total };
}

/** Increment usageCount for each applied offer (called once per placed order). */
export async function recordOfferUsage(offers = []) {
  const ids = offers.map((o) => o?.id).filter(Boolean);
  if (!ids.length) return;
  await Offer.updateMany({ id: { $in: ids } }, { $inc: { usageCount: 1 } });
}

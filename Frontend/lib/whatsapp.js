// Build a wa.me deep link. Returns '' when no number is configured so callers
// can hide the button. Number may contain spaces/+/(): only digits are kept.
export function waLink(number, message) {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message || '')}`;
}

// Compose the "Customize on WhatsApp" message: an admin-set opening line plus
// the product name, SKU and any selected options.
export function customizeMessage(template, product, optionStr) {
  const lines = [
    template || "Hi Dillora! I'd love to customise this product — can you help?",
    '',
    `Product: ${product?.name || ''}${product?.id ? ` (SKU ${product.id})` : ''}`,
  ];
  if (optionStr && optionStr !== '—') lines.push(`Selected: ${optionStr}`);
  return lines.join('\n');
}

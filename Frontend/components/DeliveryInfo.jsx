'use client';
import { useSettings } from '@/context/SettingsContext';

// Reusable delivery / policy panel shown on product (and other) pages.
// Reads admin-managed values from settings.delivery; only renders rows that
// have content (estimated delivery always shows, with sensible defaults).
export default function DeliveryInfo() {
  const { settings } = useSettings();
  const d = settings?.delivery || {};
  const min = d.estimatedDaysMin ?? 3;
  const max = d.estimatedDaysMax ?? 7;

  const rows = [
    d.returnPolicy && { icon: '↩️', label: 'Returns & refunds', text: d.returnPolicy },
    d.qualityInfo && { icon: '✨', label: 'Product quality', text: d.qualityInfo },
    d.packagingInfo && { icon: '📦', label: 'Packaging', text: d.packagingInfo },
    d.paymentInfo && { icon: '💳', label: 'Payment', text: d.paymentInfo },
    d.rateCard && { icon: '🧾', label: 'Rate card', text: d.rateCard },
  ].filter(Boolean);

  return (
    <div className="mt-6 rounded-2xl border border-[#eee3f3] bg-white p-4">
      <div className="flex items-center gap-2.5 rounded-xl bg-[#f9f2fd] px-3.5 py-3">
        <span className="text-[1.3rem]" aria-hidden="true">🚚</span>
        <div>
          <p className="font-semibold text-ink">Estimated delivery: {min}–{max} days</p>
          <p className="text-[0.82rem] text-ink-soft">Made to order &amp; shipped across India</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-2 divide-y divide-[#f0e7f8]">
          {rows.map((r) => (
            <details key={r.label} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 py-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true">{r.icon}</span>
                <span className="flex-1">{r.label}</span>
                <span className="text-ink-soft transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="whitespace-pre-line pb-2 pl-8 text-[0.9rem] leading-relaxed text-ink-soft">{r.text}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { User, Mail, Store, Percent, MessageCircle, Truck } from "lucide-react";

import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/UI";
import { notify } from "@/components/AdminToaster";
import MediaUpload from "@/components/MediaUpload";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";

const DEFAULT_DELIVERY = {
  estimatedDaysMin: 3,
  estimatedDaysMax: 7,
  returnPolicy: "",
  rateCard: "",
  qualityInfo: "",
  packagingInfo: "",
  paymentInfo: "",
};

// epoch ms <-> <input type="datetime-local"> value (local time, "YYYY-MM-DDTHH:mm").
const toLocalInput = (ms) => {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function SettingsPage() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [waInput, setWaInput] = useState("");
  const [waTemplate, setWaTemplate] = useState("");
  const [savingWa, setSavingWa] = useState(false);
  const [igInput, setIgInput] = useState("");
  const [savingIg, setSavingIg] = useState(false);
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY);
  const [savingDel, setSavingDel] = useState(false);
  const [countdown, setCountdown] = useState({
    enabled: false,
    text: "Hurry! Sale ends in",
    endsAt: 0,
  });
  const [savingCd, setSavingCd] = useState(false);
  const [reward, setReward] = useState({
    enabled: false,
    percent: 10,
    days: 30,
  });
  const [savingRw, setSavingRw] = useState(false);
  const [hero, setHero] = useState({
    enabled: false,
    headline: "",
    subheadline: "",
    ctaText: "",
    ctaLink: "",
    cta2Text: "",
    cta2Link: "",
    imageDesktop: "",
    imageMobile: "",
    bgColor: "#7a4ff0",
    overlay: 35,
  });
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setWaInput(s?.whatsappNumber || "");
      setWaTemplate(s?.whatsappTemplate || "");
      setIgInput(s?.instagramUrl || "");
      setDelivery({ ...DEFAULT_DELIVERY, ...(s?.delivery || {}) });
      if (s?.saleCountdown)
        setCountdown({
          enabled: !!s.saleCountdown.enabled,
          text: s.saleCountdown.text || "Hurry! Sale ends in",
          endsAt: s.saleCountdown.endsAt || 0,
        });
      if (s?.reviewReward)
        setReward({
          enabled: !!s.reviewReward.enabled,
          percent: s.reviewReward.percent ?? 10,
          days: s.reviewReward.days ?? 30,
        });
      if (s?.hero)
        setHero((h) => ({
          ...h,
          ...s.hero,
          bgColor: s.hero.bgColor || "#7a4ff0",
          overlay: s.hero.overlay ?? 35,
        }));
    });
  }, []);

  const saveInstagram = async () => {
    setSavingIg(true);
    const res = await api.updateSettings({ instagramUrl: igInput });
    setSavingIg(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    setIgInput(res.instagramUrl || "");
    notify("Instagram link saved");
  };

  const setD = (k) => (e) =>
    setDelivery((d) => ({ ...d, [k]: e.target.value }));
  const saveDelivery = async () => {
    setSavingDel(true);
    const payload = {
      ...delivery,
      estimatedDaysMin: Number(delivery.estimatedDaysMin) || 0,
      estimatedDaysMax: Number(delivery.estimatedDaysMax) || 0,
    };
    const res = await api.updateSettings({ delivery: payload });
    setSavingDel(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    setDelivery({ ...DEFAULT_DELIVERY, ...(res.delivery || {}) });
    notify("Delivery & policy info saved");
  };

  const saveShowDiscounts = async (val) => {
    setSettings((s) => ({ ...s, showDiscounts: val }));
    await api.updateSettings({ showDiscounts: val });
    notify(`Sale prices ${val ? "shown" : "hidden"} on the store`);
  };

  const saveWhatsApp = async () => {
    setSavingWa(true);
    const res = await api.updateSettings({
      whatsappNumber: waInput,
      whatsappTemplate: waTemplate,
    });
    setSavingWa(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    setWaInput(res.whatsappNumber || "");
    setWaTemplate(res.whatsappTemplate || "");
    notify("WhatsApp settings saved");
  };

  const saveCountdown = async () => {
    setSavingCd(true);
    const res = await api.updateSettings({ saleCountdown: countdown });
    setSavingCd(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    notify("Countdown bar saved");
  };

  const saveReward = async () => {
    setSavingRw(true);
    const res = await api.updateSettings({ reviewReward: reward });
    setSavingRw(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    notify("Review reward saved");
  };

  const saveHero = async (override) => {
    const value = { ...hero, ...(override || {}) };
    setHero(value);
    setSavingHero(true);
    const res = await api.updateSettings({ hero: value });
    setSavingHero(false);
    if (res?.error) {
      notify(res.error, "error");
      return;
    }
    setSettings(res);
    notify("Homepage hero saved");
  };

  if (!settings)
    return (
      <div className="adm__pad">
        <Spinner />
      </div>
    );

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Settings</h1>
        <p className="muted">Your account and store-wide preferences.</p>
      </header>

      {/* Account */}
      <section className="card adm__panel mb-5">
        <h3>Account</h3>
        <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <span className="stat__icon">
              <User className="h-[18px] w-[18px]" />
            </span>
            <div>
              <strong>{admin?.name || "Admin"}</strong>
              <br />
              <small className="muted">Signed-in admin</small>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="stat__icon">
              <Mail className="h-[18px] w-[18px]" />
            </span>
            <div>
              <strong>{admin?.email || "—"}</strong>
              <br />
              <small className="muted">Email</small>
            </div>
          </div>
        </div>
      </section>

      {/* Store preferences */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead">
          <h3>
            <Percent className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />
            Show sale prices
          </h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={!!settings.showDiscounts}
              onChange={(e) => saveShowDiscounts(e.target.checked)}
            />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint mt-0">
          When <strong>off</strong> (default), every product shows a single
          clean price. Turn this
          <strong> on</strong> only during a sale — then the cut price and “%
          off” badges appear across the site. (Also available on the Offers
          page.)
        </p>
      </section>

      {/* WhatsApp */}
      <section className="card adm__panel mb-5">
        <h3>
          <MessageCircle className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />
          WhatsApp business number
        </h3>
        <p className="muted adm__hint mt-0 mb-3">
          Powers the post-order “Confirm on WhatsApp” button, the site-wide
          floating chat icon, and the product “Customize on WhatsApp” button.
          Enter digits with country code (e.g. <strong>919000000000</strong>).
          Leave blank to hide all of them.
        </p>
        <input
          value={waInput}
          onChange={(e) => setWaInput(e.target.value)}
          placeholder="919000000000"
          className="mb-3 h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
        />

        <label className="mb-1 block text-[13px] font-semibold text-ink-soft">
          “Customize on WhatsApp” opening message
        </label>
        <p className="muted adm__hint mt-0 mb-2">
          Shown as the first line of the chat; the product name, SKU and
          selected options are added automatically.
        </p>
        <textarea
          value={waTemplate}
          onChange={(e) => setWaTemplate(e.target.value)}
          rows={2}
          placeholder="Hi Dillora! 💜 I'd love to customise this product — can you help?"
          className="mb-3 w-full resize-y rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-ink focus:border-orchid-500 focus:outline-none"
        />
        <button
          className="btn btn-primary"
          onClick={saveWhatsApp}
          disabled={savingWa}
        >
          {savingWa ? "Saving…" : "Save WhatsApp settings"}
        </button>

        <h3 className="mt-6">🔥 Countdown sale bar</h3>
        <p className="muted adm__hint mt-0 mb-3">
          Shows a live countdown bar at the very top of the storefront until the
          end time. Turn it off or set a past date to hide it.
        </p>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={countdown.enabled}
            onChange={(e) =>
              setCountdown((c) => ({ ...c, enabled: e.target.checked }))
            }
          />
          Show the countdown bar
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={countdown.text}
            onChange={(e) =>
              setCountdown((c) => ({ ...c, text: e.target.value }))
            }
            placeholder="Hurry! Sale ends in"
            className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <input
            type="datetime-local"
            value={toLocalInput(countdown.endsAt)}
            onChange={(e) =>
              setCountdown((c) => ({
                ...c,
                endsAt: e.target.value ? new Date(e.target.value).getTime() : 0,
              }))
            }
            className="h-11 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <button
            className="btn btn-primary"
            onClick={saveCountdown}
            disabled={savingCd}
          >
            {savingCd ? "Saving…" : "Save"}
          </button>
        </div>

        <h3 className="mt-6">Instagram</h3>
        <p className="muted adm__hint mt-0 mb-3">
          Shown as the Instagram icon in the storefront footer.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={igInput}
            onChange={(e) => setIgInput(e.target.value)}
            placeholder="https://www.instagram.com/your_handle"
            className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <button
            className="btn btn-primary"
            onClick={saveInstagram}
            disabled={savingIg}
          >
            {savingIg ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      {/* Review reward */}
      <section className="card adm__panel mb-5">
        <h3>⭐ Review reward</h3>
        <p className="muted adm__hint mt-0 mb-3">
          When on, every customer who submits a product review instantly gets a
          single-use discount coupon shown in a thank-you popup. Manage/track
          the generated coupons under <strong>Coupons</strong>.
        </p>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={reward.enabled}
            onChange={(e) =>
              setReward((r) => ({ ...r, enabled: e.target.checked }))
            }
          />
          Reward a coupon after each review
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-ink-soft">
            Discount %
            <input
              type="number"
              min="1"
              max="90"
              value={reward.percent}
              onChange={(e) =>
                setReward((r) => ({
                  ...r,
                  percent: Number(e.target.value) || 0,
                }))
              }
              className="h-11 w-24 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-ink-soft">
            Valid for (days)
            <input
              type="number"
              min="1"
              value={reward.days}
              onChange={(e) =>
                setReward((r) => ({ ...r, days: Number(e.target.value) || 0 }))
              }
              className="h-11 w-24 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={saveReward}
            disabled={savingRw}
          >
            {savingRw ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      {/* Homepage hero */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead">
          <h3>🖼️ Homepage hero</h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={hero.enabled}
              onChange={(e) => saveHero({ enabled: e.target.checked })}
            />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint mt-0 mb-3">
          When on, this replaces the built-in hero. Upload separate desktop
          &amp; mobile images so mobile isn&apos;t just a scaled-down desktop.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {["imageDesktop", "imageMobile"].map((k) => (
            <div key={k} className="rounded-xl border border-[#eee3f3] p-2">
              <p className="mb-1.5 text-[12px] font-semibold text-ink-soft">
                {k === "imageDesktop" ? "Desktop image" : "Mobile image"}
              </p>
              {hero[k] ? (
                <img
                  src={hero[k]}
                  alt=""
                  className="mb-2 h-28 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-2 grid h-28 w-full place-items-center rounded-lg bg-[#f6eefc] text-[12px] text-ink-soft">
                  No image
                </div>
              )}
              <div className="flex items-center gap-2">
                <MediaUpload
                  kind="image"
                  label={hero[k] ? "Replace" : "Upload"}
                  onUploaded={(url) => saveHero({ [k]: url })}
                />
                {hero[k] && (
                  <button
                    className="text-[12px] font-semibold text-ink-soft hover:text-ink"
                    onClick={() => saveHero({ [k]: "" })}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Headline
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.headline}
              onChange={(e) =>
                setHero((h) => ({ ...h, headline: e.target.value }))
              }
              placeholder="Little things, made with love."
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Subheadline
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.subheadline}
              onChange={(e) =>
                setHero((h) => ({ ...h, subheadline: e.target.value }))
              }
              placeholder="Handmade phone covers, charms, crochet & resin art."
            />
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Primary button text
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.ctaText}
              onChange={(e) =>
                setHero((h) => ({ ...h, ctaText: e.target.value }))
              }
              placeholder="Shop the collection"
            />
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Primary button link
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.ctaLink}
              onChange={(e) =>
                setHero((h) => ({ ...h, ctaLink: e.target.value }))
              }
              placeholder="/c/mobile-covers"
            />
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Secondary button text
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.cta2Text}
              onChange={(e) =>
                setHero((h) => ({ ...h, cta2Text: e.target.value }))
              }
              placeholder="Explore Resin Art"
            />
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Secondary button link
            </span>
            <input
              className="h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
              value={hero.cta2Link}
              onChange={(e) =>
                setHero((h) => ({ ...h, cta2Link: e.target.value }))
              }
              placeholder="/c/resin-art"
            />
          </label>
          <label className="flex items-end gap-2">
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Background
            </span>
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(hero.bgColor)
                  ? hero.bgColor
                  : "#7a4ff0"
              }
              onChange={(e) =>
                setHero((h) => ({ ...h, bgColor: e.target.value }))
              }
              className="h-11 w-14 cursor-pointer rounded-lg border-[1.5px] border-[#eee3f3]"
            />
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Image darkness (overlay {hero.overlay}%)
            </span>
            <input
              type="range"
              min="0"
              max="80"
              value={hero.overlay}
              onChange={(e) =>
                setHero((h) => ({ ...h, overlay: Number(e.target.value) }))
              }
              className="w-full accent-orchid-500"
            />
          </label>
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={() => saveHero()}
          disabled={savingHero}
        >
          {savingHero ? "Saving…" : "Save hero"}
        </button>
      </section>

      {/* Delivery & policies */}
      <section className="card adm__panel mb-5">
        <h3>
          <Truck className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />
          Delivery &amp; policies
        </h3>
        <p className="muted adm__hint mt-0 mb-3">
          Shown on product pages. Leave a field blank to hide that row.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">
            Estimated delivery — min days
            <input
              type="number"
              min="0"
              value={delivery.estimatedDaysMin}
              onChange={setD("estimatedDaysMin")}
              className="h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">
            Estimated delivery — max days
            <input
              type="number"
              min="0"
              value={delivery.estimatedDaysMax}
              onChange={setD("estimatedDaysMax")}
              className="h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
        </div>

        {[
          ["returnPolicy", "Return & refund policy"],
          ["qualityInfo", "Product quality"],
          ["packagingInfo", "Packaging information"],
          ["paymentInfo", "Payment process / instructions"],
          ["rateCard", "Rate card (optional)"],
        ].map(([k, label]) => (
          <label
            key={k}
            className="mt-3 flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft"
          >
            {label}
            <textarea
              rows={2}
              value={delivery[k]}
              onChange={setD(k)}
              className="rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 py-2 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
        ))}

        <div className="mt-4">
          <button
            className="btn btn-primary"
            onClick={saveDelivery}
            disabled={savingDel}
          >
            {savingDel ? "Saving…" : "Save delivery info"}
          </button>
        </div>
      </section>

      <TeamSection />

      <ChangePasswordSection />

      {/* Store link */}
      <section className="card adm__panel">
        <div className="adm__panelhead">
          <h3>
            <Store className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />
            Storefront
          </h3>
          <a
            className="btn btn-ghost"
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open store ↗
          </a>
        </div>
        <p className="muted adm__hint mt-0">
          The public customer website this dashboard manages.
        </p>
      </section>
    </div>
  );
}

// Team management — list admins, add members with a role, remove them (owner).
function TeamSection() {
  const [me, setMe] = useState(null);
  const [admins, setAdmins] = useState(null);
  const [accessible, setAccessible] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = () =>
    api
      .getAdmins()
      .then((r) => setAdmins(Array.isArray(r) ? r : r?.admins || []))
      .catch(() => {
        setAccessible(false);
        setAdmins([]);
      });
  useEffect(() => {
    api
      .me()
      .then((r) => setMe(r.admin))
      .catch(() => {});
    load();
  }, []);

  const canManage = me?.role === "owner" || me?.role === "manager";
  const isOwner = me?.role === "owner";
  const inputCls =
    "rounded-xl border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-ink focus:border-orchid-500 focus:outline-none";
  const roleColor = { owner: "#a64fd6", manager: "#7a4ff0", staff: "#8b7fa0" };

  const addMember = async () => {
    if (!form.name || !form.email || !form.password) {
      setMsg({ type: "err", text: "Fill name, email and password." });
      return;
    }
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api.registerAdmin(form);
      setMsg({ type: "ok", text: `Added ${form.name}.` });
      setForm({ name: "", email: "", password: "", role: "staff" });
      load();
    } catch (e) {
      setMsg({ type: "err", text: e.message || "Could not add team member." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.name} (${a.email})?`)) return;
    try {
      await api.removeAdmin(a.id);
      load();
    } catch (e) {
      setMsg({ type: "err", text: e.message || "Could not remove." });
    }
  };

  if (admins === null || !accessible) return null; // loading, or a staff account (hidden)

  return (
    <section className="card adm__panel mb-5">
      <div className="adm__panelhead">
        <h3>👥 Team</h3>
      </div>
      <p className="muted adm__hint mt-0">
        Admins who can access this dashboard.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {admins?.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#eee3f3] px-3.5 py-2.5"
          >
            <div>
              <div className="font-semibold text-ink">
                {a.name}{" "}
                {me?.id === a.id && (
                  <span className="text-ink-soft">(you)</span>
                )}
              </div>
              <div className="text-[0.85rem] text-ink-soft">{a.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-2.5 py-1 text-[0.72rem] font-bold uppercase text-white"
                style={{ background: roleColor[a.role] || "#8b7fa0" }}
              >
                {a.role}
              </span>
              {isOwner && me?.id !== a.id && (
                <button
                  className="text-[0.85rem] font-semibold text-[#c4495b] hover:underline"
                  onClick={() => remove(a)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {canManage && (
        <div className="mt-4 border-t border-[#eee3f3] pt-4">
          <p className="mb-2 font-semibold text-ink">Add a team member</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
            />
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
            <input
              className={inputCls}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password (min 6)"
            />
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              {isOwner && <option value="owner">Owner</option>}
            </select>
          </div>
          {msg.text && (
            <p
              className={`mt-2 text-sm font-semibold ${msg.type === "ok" ? "text-[#2e9e6b]" : "text-[#c4495b]"}`}
            >
              {msg.text}
            </p>
          )}
          <button
            className="btn btn-primary mt-3"
            onClick={addMember}
            disabled={busy}
          >
            {busy ? "Adding…" : "Add member"}
          </button>
        </div>
      )}
    </section>
  );
}

// Let a signed-in admin change their own password.
function ChangePasswordSection() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const inputCls =
    "w-full rounded-xl border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-ink focus:border-orchid-500 focus:outline-none";

  const save = async () => {
    if (!cur || !next) {
      setMsg({ type: "err", text: "Enter your current and new password." });
      return;
    }
    if (next.length < 6) {
      setMsg({
        type: "err",
        text: "New password must be at least 6 characters.",
      });
      return;
    }
    if (next !== confirm) {
      setMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api.changePassword(cur, next);
      setMsg({ type: "ok", text: "Password changed successfully." });
      setCur("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setMsg({ type: "err", text: e.message || "Could not change password." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card adm__panel mb-5">
      <div className="adm__panelhead">
        <h3>🔒 Change password</h3>
      </div>
      <p className="muted adm__hint mt-0">
        Update the password for your own admin account.
      </p>
      <div className="mt-3 grid max-w-[420px] gap-3">
        <input
          className={inputCls}
          type="password"
          autoComplete="current-password"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          placeholder="Current password"
        />
        <input
          className={inputCls}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password (min 6 characters)"
        />
        <input
          className={inputCls}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
        />
        {msg.text && (
          <p
            className={`text-sm font-semibold ${msg.type === "ok" ? "text-[#2e9e6b]" : "text-[#c4495b]"}`}
          >
            {msg.text}
          </p>
        )}
        <button
          className="btn btn-primary justify-self-start"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving…" : "Change password"}
        </button>
      </div>
    </section>
  );
}

import Policy from "../models/Policy.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { POLICIES } from "../seed/policiesData.js";

// Lazily seed the default policies the first time the collection is empty, so
// the feature works on any environment without a manual seed step.
async function ensureSeeded() {
  if ((await Policy.countDocuments()) > 0) return;
  const docs = Object.entries(POLICIES).map(([category, p]) => ({
    category,
    title: p.title,
    sections: p.sections,
  }));
  try {
    await Policy.insertMany(docs, { ordered: false });
  } catch {
    /* concurrent seed races are harmless (unique index) */
  }
}

// GET /api/policy/:category  (public) — the policy for a category, falling back
// to the store-wide "general" policy when the category has none.
export const getPolicy = asyncHandler(async (req, res) => {
  await ensureSeeded();
  const category = String(req.params.category || "").trim();
  let doc = category ? await Policy.findOne({ category }) : null;
  if (!doc) doc = await Policy.findOne({ category: "general" });
  if (!doc) return res.json({ category: "general", title: "Shipping & Return Policy", sections: [] });
  const j = doc.toJSON();
  res.json({ category: j.category, title: j.title, sections: j.sections || [] });
});

// GET /api/policy  (admin) — every policy, for the management screen.
export const getAllPolicies = asyncHandler(async (req, res) => {
  await ensureSeeded();
  const list = await Policy.find().sort({ category: 1 });
  res.json(list.map((p) => p.toJSON()));
});

// Normalize incoming sections: trim headings + clauses, drop empty rows.
function cleanSections(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => ({
      heading: String(s?.heading || "").trim(),
      clauses: Array.isArray(s?.clauses)
        ? s.clauses.map((c) => String(c || "").trim()).filter(Boolean)
        : [],
    }))
    .filter((s) => s.heading || s.clauses.length);
}

// PUT /api/policy/:category  (admin) — upsert a policy's title + sections.
export const upsertPolicy = asyncHandler(async (req, res) => {
  const category = String(req.params.category || "").trim();
  if (!category) return res.status(400).json({ error: "Category is required." });

  const title = String(req.body.title || "Shipping & Return Policy").trim();
  const sections = cleanSections(req.body.sections);

  const doc = await Policy.findOneAndUpdate(
    { category },
    { $set: { title, sections } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc.toJSON());
});

// DELETE /api/policy/:category  (admin) — remove a category policy (not general).
export const deletePolicy = asyncHandler(async (req, res) => {
  const category = String(req.params.category || "").trim();
  if (category === "general") {
    return res.status(400).json({ error: "The general (fallback) policy can't be deleted." });
  }
  const doc = await Policy.findOneAndDelete({ category });
  if (!doc) return res.status(404).json({ error: "Policy not found." });
  res.json({ ok: true });
});

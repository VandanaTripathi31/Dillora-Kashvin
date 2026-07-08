// Default Shipping & Return policy content, structured as titled sections of
// clauses and keyed by category id ("general" = store-wide fallback). Seeded
// into the Policy collection; fully editable later from the admin Policies
// screen without a redeploy.

const SHIPPING = {
  heading: "Shipping & Delivery",
  clauses: [
    "Each piece is made to order — please allow up to 2 business days of processing before dispatch.",
    "Delivery within Mumbai: 3–4 business days after dispatch.",
    "Delivery across the rest of India: 5–7 business days after dispatch.",
  ],
};

const CANCEL = {
  heading: "Cancellation",
  clauses: [
    "Orders can be cancelled within 24 hours of placing them.",
    "Once crafting or production has started, cancellation is no longer possible.",
  ],
};

const REPLACEMENT = {
  heading: "Replacement & Damage",
  clauses: [
    "Replacement is offered only for genuine transit damage or a manufacturing defect.",
    "Claims must be raised within 48 hours of delivery with your order number, an unboxing video, and clear photos of the item and packaging.",
  ],
};

export const POLICIES = {
  general: {
    title: "Shipping & Return Policy",
    sections: [
      SHIPPING,
      CANCEL,
      REPLACEMENT,
      {
        heading: "Returns",
        clauses: [
          "As every item is handmade, customized or personalized, products are non-returnable except in the case of a verified defect or transit damage.",
          "Colours may vary slightly from what appears on your screen due to lighting and display differences.",
        ],
      },
      {
        heading: "General",
        clauses: [
          "Our liability for any order is limited to the purchase price of that order.",
          "We are not responsible for delays caused by events beyond our control (force majeure).",
          "These terms are governed by the laws of India.",
        ],
      },
    ],
  },

  "mobile-covers": {
    title: "Shipping & Return Policy",
    sections: [
      {
        heading: "Handmade & Fit",
        clauses: [
          "Covers are handmade/handcrafted, so slight variations in colour, texture and finish are natural and not defects.",
          "You are responsible for selecting the correct phone model — replacements are not offered for the wrong model chosen at checkout.",
        ],
      },
      {
        heading: "Care",
        clauses: [
          "Crochet covers: hand wash only, no bleach, no machine wash; dry naturally.",
          "Resin covers: avoid direct sunlight, heat and harsh chemicals; colour may vary with lighting.",
          "Printed covers: print placement may vary very slightly from the on-screen preview.",
        ],
      },
      SHIPPING,
      {
        heading: "Cancellation",
        clauses: [
          "Orders can be cancelled within 24 hours of ordering.",
          "Customization is locked and cancellation is not accepted once production starts.",
        ],
      },
      REPLACEMENT,
      {
        heading: "Non-returnable",
        clauses: [
          "Change of mind, colour or design preference, minor bubbles or print variation, and the wrong model chosen by the customer are not eligible for return.",
        ],
      },
    ],
  },

  "mobile-charms": {
    title: "Shipping & Return Policy",
    sections: [
      {
        heading: "Use & Care",
        clauses: [
          "Charms are decorative accessories — avoid pulling or twisting them with force.",
          "Keep away from small children as small parts can be a choking hazard.",
          "Avoid contact with water, perfume, chemicals and pressure to keep them looking their best.",
        ],
      },
      SHIPPING,
      CANCEL,
      REPLACEMENT,
      {
        heading: "Non-returnable",
        clauses: ["Colour difference, personal preference and change of mind are not eligible for return."],
      },
    ],
  },

  crochet: {
    title: "Shipping & Return Policy",
    sections: [
      {
        heading: "Handmade & Care",
        clauses: [
          "Every crochet piece is handmade, so small variations in size, colour and stitch are natural and not defects.",
          "For decorative use — spot clean only, no bleach, no machine wash; allow to dry naturally.",
          "Contains small parts — keep away from young children (choking hazard).",
        ],
      },
      SHIPPING,
      CANCEL,
      REPLACEMENT,
      {
        heading: "Non-returnable",
        clauses: [
          "Handmade variation, colour difference, personal preference and change of mind are not eligible for return.",
        ],
      },
    ],
  },

  "resin-art": {
    title: "Shipping & Return Policy",
    sections: [
      {
        heading: "Handcrafted Resin",
        clauses: [
          "Each resin piece is handcrafted — natural bubbles and slight variations are part of the art and not defects.",
          "Colour may appear different under different lighting.",
          "Avoid direct sunlight, heat and harsh chemicals to protect the finish.",
        ],
      },
      SHIPPING,
      {
        heading: "Cancellation",
        clauses: [
          "Orders can be cancelled within 24 hours.",
          "Customization is locked once production starts.",
        ],
      },
      REPLACEMENT,
      {
        heading: "Non-returnable",
        clauses: [
          "Colour or design preference, minor bubbles, and the wrong model or size chosen by the customer are not eligible for return.",
        ],
      },
    ],
  },

  tshirts: {
    title: "Shipping & Return Policy",
    sections: [
      {
        heading: "Made to Order",
        clauses: [
          "T-shirts and hoodies are made to order — slight variation in print placement and colour is normal.",
          "Please choose your size carefully using the size guide; for custom designs you are responsible for the spelling, artwork quality and the right to use it.",
        ],
      },
      {
        heading: "Care",
        clauses: ["Machine wash cold, inside out; do not bleach; do not iron directly on the print."],
      },
      SHIPPING,
      {
        heading: "Cancellation",
        clauses: [
          "Orders can be cancelled within 24 hours of ordering.",
          "Cancellation is not possible once printing or production has started.",
        ],
      },
      REPLACEMENT,
      {
        heading: "Non-returnable",
        clauses: ["Change of mind, wrong size chosen, and minor print or colour variation are not eligible for return."],
      },
    ],
  },
};
